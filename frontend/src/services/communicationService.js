import { dbOps } from '../db/database';
import { activityService } from './activityService';
import { recruiterActivityService } from './recruiterActivityService';
import { authService } from './authService';

export const communicationService = {
  getCommunications: async (recruiterId) => {
    const [comms, users] = await Promise.all([
      dbOps.getAll('communications'),
      dbOps.getAll('users')
    ]);

    const userMap = {};
    users.forEach((u) => { userMap[u.id] = u.name; });

    const filtered = comms
      .filter((c) => Number(c.recruiter_id) === Number(recruiterId))
      .map((c) => ({
        ...c,
        logged_by_name: userMap[c.logged_by] || 'Staff Member'
      }))
      .sort((a, b) => new Date(b.communication_date || b.created_at) - new Date(a.communication_date || a.created_at));

    return filtered;
  },

  createCommunication: async (data) => {
    const newComm = await dbOps.insert('communications', {
      ...data,
      recruiter_id: Number(data.recruiter_id),
      communication_date: data.communication_date || new Date().toISOString()
    });

    let lead = null;
    if (data.recruiter_id) {
      try {
        lead = await dbOps.getById('recruiters', data.recruiter_id);
        await dbOps.update('recruiters', data.recruiter_id, {
          last_contacted_date: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Failed to update last_contacted_date on recruiter', e);
      }
    }

    const currentUser = authService.getSessionUser();
    await activityService.log('Communication Logged', 'Communication', newComm.id, `Logged ${data.communication_type} conversation`);

    // Log to recruiter_activities
    if (lead) {
      await recruiterActivityService.logActivity({
        recruiter_id: lead.assigned_to || currentUser?.id,
        recruiter_name: currentUser?.name || 'Recruiter',
        action_type: 'College contacted',
        job_id: lead.lead_id,
        job_name: lead.company_name,
        previous_status: lead.status,
        new_status: lead.status,
        description: `${data.communication_type} interaction with ${lead.company_name} (SPOC: ${lead.recruiter_name || 'N/A'}, Phone: ${lead.mobile || 'N/A'}). Summary: ${data.summary || 'Contact completed'}${data.next_steps ? ' | Next Steps: ' + data.next_steps : ''}`
      });
    }

    return newComm;
  }
};
