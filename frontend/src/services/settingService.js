import { dbOps } from '../db/database';

export const settingService = {
  getSettings: async () => {
    const list = await dbOps.getAll('settings');
    const result = {};
    list.forEach(s => {
      result[s.key] = s.value;
    });
    return result;
  },

  updateSettings: async (settingsObj) => {
    const entries = Object.entries(settingsObj.settings || settingsObj || {});
    const existing = await dbOps.getAll('settings');
    const existingMap = {};
    existing.forEach(e => { existingMap[e.key] = e; });

    for (const [key, value] of entries) {
      if (existingMap[key]) {
        await dbOps.update('settings', existingMap[key].id, { value: String(value) });
      } else {
        await dbOps.insert('settings', { key, value: String(value), description: '' });
      }
    }
    return { message: 'Settings updated successfully' };
  }
};
