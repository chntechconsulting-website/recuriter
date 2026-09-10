import { dbOps } from '../db/database';
import { authService } from './authService';

export const reportService = {
  getAnalytics: async (startDate, endDate) => {
    const currentUser = authService.getSessionUser();
    const isPrivileged = authService.isPrivilegedUser(currentUser);

    const [recruiters, candidates, users, followUps] = await Promise.all([
      dbOps.getAll('recruiters'),
      dbOps.getAll('candidates'),
      dbOps.getAll('users'),
      dbOps.getAll('follow_ups')
    ]);

    let filteredRecruiters = [...recruiters];
    let filteredCandidates = [...candidates];

    if (!isPrivileged && currentUser?.id) {
      filteredRecruiters = filteredRecruiters.filter(r => Number(r.assigned_to) === Number(currentUser.id));
    }

    if (startDate) {
      filteredRecruiters = filteredRecruiters.filter(r => r.created_at && r.created_at.split('T')[0] >= startDate);
    }
    if (endDate) {
      filteredRecruiters = filteredRecruiters.filter(r => r.created_at && r.created_at.split('T')[0] <= endDate);
    }

    const total_recruiters = filteredRecruiters.length;
    let mou_signed = 0;
    let connected = 0;
    let interested = 0;
    let yet_to_connected = 0;

    filteredRecruiters.forEach(r => {
      const st = (r.status || '').toUpperCase();
      if (st === 'MOU_SIGNED') mou_signed++;
      else if (st === 'CONNECTED') connected++;
      else if (st === 'INTERESTED') interested++;
      else yet_to_connected++;
    });

    const conversion_rate = total_recruiters > 0 ? Number(((mou_signed / total_recruiters) * 100).toFixed(1)) : 0;

    const userMap = {};
    users.forEach(u => { userMap[u.id] = u.name; });

    const staffPerformance = {};
    filteredRecruiters.forEach(r => {
      const uid = r.assigned_to || 0;
      const uname = userMap[uid] || 'Unassigned';
      if (!staffPerformance[uname]) {
        staffPerformance[uname] = { assigned: 0, mou_signed: 0, connected: 0, conversion: 0 };
      }
      staffPerformance[uname].assigned++;
      if (r.status === 'MOU_SIGNED') staffPerformance[uname].mou_signed++;
      if (r.status === 'CONNECTED') staffPerformance[uname].connected++;
    });

    Object.keys(staffPerformance).forEach(k => {
      const p = staffPerformance[k];
      p.conversion = p.assigned > 0 ? Number(((p.mou_signed / p.assigned) * 100).toFixed(1)) : 0;
    });

    return {
      total_recruiters,
      total_candidates: filteredCandidates.length,
      mou_signed,
      connected,
      interested,
      yet_to_connected,
      conversion_rate,
      staff_performance: staffPerformance
    };
  }
};
