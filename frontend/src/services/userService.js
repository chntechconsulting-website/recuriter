import { dbOps } from '../db/database';

export const userService = {
  getUsers: async (params = {}) => {
    const users = await dbOps.getAll('users');
    const page = Number(params.page) || 1;
    const pageSize = Number(params.page_size) || 10;

    let filtered = [...users];
    if (params.search && params.search.trim()) {
      const term = params.search.trim().toLowerCase();
      filtered = filtered.filter(u => 
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.phone && u.phone.toLowerCase().includes(term))
      );
    }
    if (params.role && params.role !== 'ALL') {
      filtered = filtered.filter(u => u.role === params.role);
    }

    const total = filtered.length;
    const offset = (page - 1) * pageSize;
    const items = filtered.slice(offset, offset + pageSize);
    const total_pages = Math.ceil(total / pageSize) || 1;

    return { items, total, page, page_size: pageSize, total_pages };
  },

  getSimpleUsers: async (options = {}) => {
    const users = await dbOps.getAll('users');
    let filtered = users;
    if (!options.includeAdmins) {
      filtered = filtered.filter(u => (u.role || '').toUpperCase() !== 'ADMIN');
    }
    return filtered.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role
    }));
  },

  createUser: async (data) => {
    const users = await dbOps.getAll('users');
    const exists = users.find(u => (u.email || '').toLowerCase() === (data.email || '').toLowerCase().trim());
    if (exists) {
      throw { response: { data: { detail: 'User with this email already exists' } } };
    }

    const passwordVal = (data.password || data.password_hash || 'Chn@2021').trim();
    const userPayload = {
      name: (data.name || '').trim(),
      email: (data.email || '').trim().toLowerCase(),
      phone: data.phone ? String(data.phone).trim() : null,
      role: data.role || 'STAFF',
      status: data.status || 'ACTIVE',
      password_hash: passwordVal
    };

    const newUser = await dbOps.insert('users', userPayload);
    return newUser;
  },

  updateUser: async (id, data) => {
    const payload = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.email !== undefined) payload.email = data.email.trim().toLowerCase();
    if (data.phone !== undefined) payload.phone = data.phone ? String(data.phone).trim() : null;
    if (data.role !== undefined) payload.role = data.role;
    if (data.status !== undefined) payload.status = data.status;
    if (data.password && data.password.trim()) {
      payload.password_hash = data.password.trim();
    } else if (data.password_hash && data.password_hash.trim()) {
      payload.password_hash = data.password_hash.trim();
    }

    const updated = await dbOps.update('users', id, payload);
    return updated;
  },

  deleteUser: async (id) => {
    await dbOps.delete('users', id);
    return { message: 'User deleted' };
  }
};
