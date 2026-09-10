import { dbOps } from '../db/database';
import { activityService } from './activityService';

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

    if (data.recruiter_id) {
      try {
        await dbOps.update('recruiters', data.recruiter_id, {
          last_contacted_date: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Failed to update last_contacted_date on recruiter', e);
      }
    }

    await activityService.log('Communication Logged', 'Communication', newComm.id, `Logged ${data.communication_type} conversation`);
    return newComm;
  }
};
