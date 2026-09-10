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

  getSimpleUsers: async () => {
    const users = await dbOps.getAll('users');
    return users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role
    }));
  },

  createUser: async (data) => {
    const users = await dbOps.getAll('users');
    const exists = users.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      throw { response: { data: { detail: 'User with this email already exists' } } };
    }
    const newUser = await dbOps.insert('users', {
      ...data,
      status: data.status || 'ACTIVE',
      role: data.role || 'STAFF'
    });
    return newUser;
  },

  updateUser: async (id, data) => {
    const updated = await dbOps.update('users', id, data);
    return updated;
  },

  deleteUser: async (id) => {
    await dbOps.delete('users', id);
    return { message: 'User deleted' };
  }
};
