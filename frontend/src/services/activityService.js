import { dbOps } from '../db/database';

export const activityService = {
  getLogs: async (params = {}) => {
    const [logs, users, recruiterActivities] = await Promise.all([
      dbOps.getAll('activity_logs'),
      dbOps.getAll('users'),
      dbOps.getAll('recruiter_activities').catch(() => [])
    ]);

    const userMap = {};
    users.forEach(u => { userMap[u.id] = u.name; });

    // Format recruiter_activities so they seamlessly display in audit logs
    const mappedRecruiterActivities = (recruiterActivities || []).map(r => ({
      id: `rec-${r.id}`,
      user_id: Number(r.recruiter_id),
      action: r.action_type,
      module: r.candidate_id ? 'Candidates' : ((r.job_name || '').toLowerCase().includes('college') ? 'Leads' : 'Recruiters'),
      record_id: r.candidate_id || r.job_id || '',
      details: r.description || `${r.action_type}${r.candidate_name ? `: ${r.candidate_name}` : ''}`,
      ip_address: '127.0.0.1',
      created_at: r.created_at,
      user_name: r.recruiter_name || userMap[r.recruiter_id] || 'Recruiter'
    }));

    const allLogs = [...logs, ...mappedRecruiterActivities];
    let filtered = allLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (params.module && params.module !== 'ALL') {
      filtered = filtered.filter(l => (l.module || '').toLowerCase() === params.module.toLowerCase());
    }
    if (params.action && params.action !== 'ALL') {
      filtered = filtered.filter(l => (l.action || '').toLowerCase() === params.action.toLowerCase());
    }
    if (params.user_id) {
      filtered = filtered.filter(l => Number(l.user_id) === Number(params.user_id));
    }

    const page = Number(params.page) || 1;
    const pageSize = Number(params.page_size) || 20;
    const total = filtered.length;
    const offset = (page - 1) * pageSize;
    const items = filtered.slice(offset, offset + pageSize).map(l => ({
      ...l,
      user_name: l.user_name || userMap[l.user_id] || 'System'
    }));

    const total_pages = Math.ceil(total / pageSize) || 1;
    return { items, total, page, page_size: pageSize, total_pages };
  },

  log: async (action, module, recordId, details) => {
    try {
      const savedUser = localStorage.getItem('user');
      const user = savedUser ? JSON.parse(savedUser) : null;
      await dbOps.insert('activity_logs', {
        user_id: user?.id || 1,
        action,
        module,
        record_id: String(recordId || ''),
        details: details || `${action} on ${module}`,
        ip_address: '127.0.0.1'
      });
    } catch (e) {
      console.warn('Failed to log activity', e);
    }
  }
};
