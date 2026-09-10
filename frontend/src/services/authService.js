import { dbOps } from '../db/database';

export const authService = {
  login: async (credentials = {}) => {
    const emailInput = (credentials.email || credentials.username || '').trim().toLowerCase();
    const users = await dbOps.getAll('users');
    const user = users.find((u) => (u.email || '').toLowerCase() === emailInput);

    if (!user) {
      // If default admin does not exist yet or matches default demo emails, create/return admin
      if (emailInput.includes('admin') || emailInput === '') {
        const defaultAdmin = {
          id: 1,
          name: 'Administrator',
          email: emailInput || 'admin@recruiter.com',
          role: 'ADMIN',
          status: 'ACTIVE',
          phone: '9876543210'
        };
        await dbOps.insert('users', defaultAdmin);
        const token = 'local_admin_token_' + Date.now();
        return { access_token: token, token_type: 'bearer', user: defaultAdmin };
      }
      throw { response: { data: { detail: 'Invalid email/username or password' } } };
    }

    const token = `local_token_${user.id}_` + Date.now();
    return {
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status
      }
    };
  },

  logout: async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { message: 'Logged out successfully' };
  },

  getCurrentUser: async () => {
    const saved = localStorage.getItem('user');
    if (!saved) throw new Error('Not authenticated');
    const parsed = JSON.parse(saved);
    const user = await dbOps.getById('users', parsed.id);
    return user || parsed;
  },

  changePassword: async ({ current_password, new_password }) => {
    const saved = localStorage.getItem('user');
    if (!saved) throw new Error('Not authenticated');
    const parsed = JSON.parse(saved);
    const user = await dbOps.getById('users', parsed.id);
    if (user) {
      await dbOps.update('users', user.id, { password_hash: new_password });
    }
    return { message: 'Password updated successfully' };
  },

  getSessionUser: () => {
    try {
      if (typeof window === 'undefined') return null;
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  isPrivilegedUser: (user) => {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    return role === 'ADMIN' || role === 'HR' || role === 'SUPER_ADMIN';
  }
};
