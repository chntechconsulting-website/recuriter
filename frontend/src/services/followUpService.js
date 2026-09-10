import { dbOps } from '../db/database';
import { activityService } from './activityService';
import { authService } from './authService';

export const followUpService = {
  getFollowUps: async (params = {}) => {
    const currentUser = authService.getSessionUser();
    const isPrivileged = authService.isPrivilegedUser(currentUser);

    const [followUps, recruiters, users] = await Promise.all([
      dbOps.getAll('follow_ups'),
      dbOps.getAll('recruiters'),
      dbOps.getAll('users')
    ]);

    const recruiterMap = {};
    recruiters.forEach((r) => { recruiterMap[r.id] = r; });

    const userMap = {};
    users.forEach((u) => { userMap[u.id] = u.name; });

    const todayStr = new Date().toISOString().split('T')[0];

    // Filter followups by assignment if non-privileged
    let scopedFollowUps = followUps;
    if (!isPrivileged && currentUser?.id) {
      scopedFollowUps = followUps.filter((f) => {
        const rec = recruiterMap[f.recruiter_id];
        const assignedStaffId = f.assigned_to || rec?.assigned_to;
        return Number(assignedStaffId) === Number(currentUser.id);
      });
    }

    let enriched = scopedFollowUps.map((f) => {
      const rec = recruiterMap[f.recruiter_id] || {};
      return {
        ...f,
        recruiter_company: rec.company_name || 'Unknown Institution',
        recruiter_name: rec.recruiter_name || '-',
        recruiter_mobile: rec.mobile || '-',
        assigned_user_name: userMap[f.assigned_to || rec.assigned_to] || 'Unassigned'
      };
    });

    if (params.category === 'today') {
      enriched = enriched.filter((f) => f.follow_up_date === todayStr && f.status !== 'Completed');
    } else if (params.category === 'overdue') {
      enriched = enriched.filter((f) => f.follow_up_date && f.follow_up_date < todayStr && f.status !== 'Completed');
    } else if (params.category === 'upcoming') {
      enriched = enriched.filter((f) => f.follow_up_date && f.follow_up_date > todayStr && f.status !== 'Completed');
    }

    if (params.status && params.status !== 'ALL') {
      enriched = enriched.filter((f) => f.status === params.status);
    }

    return enriched.sort((a, b) => new Date(b.follow_up_date) - new Date(a.follow_up_date));
  },

  createFollowUp: async (data) => {
    const newFollowUp = await dbOps.insert('follow_ups', {
      ...data,
      recruiter_id: Number(data.recruiter_id),
      status: data.status || 'Pending'
    });

    if (data.follow_up_date && data.recruiter_id) {
      try {
        await dbOps.update('recruiters', data.recruiter_id, {
          next_follow_up_date: data.follow_up_date
        });
      } catch (e) {
        console.warn('Failed to update next_follow_up_date on recruiter', e);
      }
    }

    await activityService.log('Follow-up Scheduled', 'FollowUps', newFollowUp.id, `Scheduled ${data.follow_up_type} for ${data.follow_up_date}`);
    return newFollowUp;
  },

  updateFollowUp: async (id, data) => {
    const updated = await dbOps.update('follow_ups', id, data);
    return updated;
  },

  deleteFollowUp: async (id) => {
    await dbOps.delete('follow_ups', id);
    return { message: 'Follow-up deleted' };
  }
};
