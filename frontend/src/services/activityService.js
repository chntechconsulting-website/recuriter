import { dbOps } from '../db/database';

export const activityService = {
  getLogs: async (params = {}) => {
    const [logs, users] = await Promise.all([
      dbOps.getAll('activity_logs'),
      dbOps.getAll('users')
    ]);

    const userMap = {};
    users.forEach(u => { userMap[u.id] = u.name; });

    let filtered = [...logs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (params.module && params.module !== 'ALL') {
      filtered = filtered.filter(l => l.module === params.module);
    }
    if (params.action && params.action !== 'ALL') {
      filtered = filtered.filter(l => l.action === params.action);
    }

    const page = Number(params.page) || 1;
    const pageSize = Number(params.page_size) || 20;
    const total = filtered.length;
    const offset = (page - 1) * pageSize;
    const items = filtered.slice(offset, offset + pageSize).map(l => ({
      ...l,
      user_name: userMap[l.user_id] || 'System'
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
