import { neon } from '@neondatabase/serverless';

export const NEON_CONNECTION_STRING = 
  import.meta.env.VITE_DATABASE_URL || 
  "postgresql://neondb_owner:npg_4xTuzRpw9tmY@ep-lucky-feather-b3y9zm31-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

export const sql = neon(NEON_CONNECTION_STRING);

const TABLE_MAP = {
  recruiters: 'recruiter_leads',
  candidates: 'candidates',
  users: 'users',
  follow_ups: 'follow_ups',
  communications: 'communication_history',
  status_history: 'status_history',
  activity_logs: 'activity_logs',
  recruiter_activities: 'recruiter_activities',
  recruiter_college_assignments: 'recruiter_college_assignments',
  recruiter_vendor_assignments: 'recruiter_vendor_assignments',
  settings: 'system_settings'
};

export function formatSqlValue(val, key = '') {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isNaN(val) ? 'NULL' : String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  const str = String(val).trim();
  if (str === '' && (key.endsWith('_id') || key.endsWith('_by') || key.endsWith('_to') || key === 'id' || key === 'candidates_required')) {
    return 'NULL';
  }
  return `'${str.replace(/'/g, "''")}'`;
}

const DB_NAME = 'RecruiterCandidateDB_v14';
const DB_VERSION = 1;

const STORES = [
  'users',
  'recruiters',
  'candidates',
  'follow_ups',
  'communications',
  'status_history',
  'activity_logs',
  'recruiter_activities',
  'recruiter_college_assignments',
  'recruiter_vendor_assignments',
  'settings'
];

let dbPromise = null;

// High-speed In-Memory Cache and In-Flight Request Deduplicator
const memCache = new Map();
const inFlightPromises = new Map();

export const clearMemoryCache = (storeName) => {
  if (storeName) {
    memCache.delete(storeName);
  } else {
    memCache.clear();
  }
};

// Initialize local IndexedDB as persistent cache
export const openDatabase = () => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        STORES.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
            if (storeName === 'recruiters') {
              store.createIndex('lead_id', 'lead_id', { unique: false });
              store.createIndex('status', 'status', { unique: false });
              store.createIndex('district', 'district', { unique: false });
            } else if (storeName === 'candidates') {
              store.createIndex('candidate_id', 'candidate_id', { unique: false });
              store.createIndex('contact_number', 'contact_number', { unique: false });
              store.createIndex('email', 'email', { unique: false });
              store.createIndex('status', 'status', { unique: false });
            } else if (storeName === 'users') {
              store.createIndex('email', 'email', { unique: false });
            } else if (storeName === 'follow_ups') {
              store.createIndex('recruiter_id', 'recruiter_id', { unique: false });
              store.createIndex('follow_up_date', 'follow_up_date', { unique: false });
            } else if (storeName === 'communications') {
              store.createIndex('recruiter_id', 'recruiter_id', { unique: false });
            } else if (storeName === 'status_history') {
              store.createIndex('recruiter_id', 'recruiter_id', { unique: false });
            }
          }
        });
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
};

// Non-blocking async local cache sync
const syncToLocalCache = (storeName, items) => {
  if (typeof window === 'undefined' || !items || items.length === 0) return;

  const runSync = async () => {
    try {
      const db = await openDatabase();
      if (!db) return;
      const tx = db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      for (let i = 0; i < items.length; i++) {
        store.put(items[i]);
      }
    } catch {
      // Non-fatal background cache sync
    }
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => runSync(), { timeout: 2000 });
  } else {
    setTimeout(runSync, 50);
  }
};

const getFromLocalCache = async (storeName) => {
  try {
    const db = await openDatabase();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
};



// Database Operations Layer (Direct Neon Singapore Cloud + In-Memory Caching + Fallback)
export const dbOps = {
  getAll: async (storeName, options = {}) => {
    // 1. Instant return from in-memory cache if available in current session and not forced fresh
    if (!options.forceFresh && memCache.has(storeName)) {
      return memCache.get(storeName);
    }

    // 2. Request deduplication: if identical store query is already in-flight, return shared promise
    if (inFlightPromises.has(storeName)) {
      return inFlightPromises.get(storeName);
    }

    const fetchPromise = (async () => {
      const table = TABLE_MAP[storeName] || storeName;

      // 3. Query directly from Neon DB
      try {
        const rows = await sql.query(`SELECT * FROM ${table} ORDER BY id ASC`);
        if (Array.isArray(rows)) {
          memCache.set(storeName, rows);
          syncToLocalCache(storeName, rows);
          return rows;
        }
      } catch (err) {
        console.warn(`Neon DB live query error for ${table}, attempting local fallback:`, err);
      }

      // 4. Fallback to local cache if Neon DB request fails (e.g. offline)
      const cached = await getFromLocalCache(storeName);
      if (cached && cached.length > 0) {
        memCache.set(storeName, cached);
        return cached;
      }
      return [];
    })();

    inFlightPromises.set(storeName, fetchPromise);
    try {
      const result = await fetchPromise;
      return result;
    } finally {
      inFlightPromises.delete(storeName);
    }
  },

  getById: async (storeName, id) => {
    const rawId = String(id || '').trim();
    const numId = Number(id);
    const isNum = !isNaN(numId) && numId > 0 && String(numId) === rawId;

    if (memCache.has(storeName)) {
      const item = memCache.get(storeName).find(i => 
        (isNum && Number(i.id) === numId) ||
        (i.candidate_id && i.candidate_id.toLowerCase() === rawId.toLowerCase()) ||
        (i.lead_id && i.lead_id.toLowerCase() === rawId.toLowerCase()) ||
        (!isNum && String(i.id) === rawId)
      );
      if (item) return item;
    }

    const table = TABLE_MAP[storeName] || storeName;
    try {
      let queryStr;
      if (isNum) {
        queryStr = `SELECT * FROM ${table} WHERE id = ${numId} LIMIT 1`;
      } else {
        const idCol = table === 'candidates' ? 'candidate_id' : (table === 'recruiter_leads' ? 'lead_id' : 'id');
        queryStr = `SELECT * FROM ${table} WHERE ${idCol} = '${rawId.replace(/'/g, "''")}' LIMIT 1`;
      }
      const rows = await sql.query(queryStr);
      if (rows && rows.length > 0) {
        return rows[0];
      }
    } catch {
      // Fallback
    }

    const all = await dbOps.getAll(storeName);
    return all.find(i => 
      (isNum && Number(i.id) === numId) ||
      (i.candidate_id && i.candidate_id.toLowerCase() === rawId.toLowerCase()) ||
      (i.lead_id && i.lead_id.toLowerCase() === rawId.toLowerCase()) ||
      (!isNum && String(i.id) === rawId)
    ) || null;
  },

  insert: async (storeName, item) => {
    const table = TABLE_MAP[storeName] || storeName;
    const cleanItem = { ...item };
    delete cleanItem.id;

    if (table === 'users') {
      if (cleanItem.password !== undefined && !cleanItem.password_hash) {
        cleanItem.password_hash = cleanItem.password;
      }
      delete cleanItem.password;
    }

    const keys = Object.keys(cleanItem).filter(k => cleanItem[k] !== undefined);
    if (item.id) {
      keys.unshift('id');
      cleanItem.id = item.id;
    }

    const colNames = keys.join(', ');
    const values = keys.map(k => formatSqlValue(cleanItem[k], k)).join(', ');

    let inserted = null;
    try {
      const queryStr = `INSERT INTO ${table} (${colNames}) VALUES (${values}) RETURNING *`;
      const res = await sql.query(queryStr);
      if (res && res[0]) {
        inserted = res[0];
      }
    } catch (err) {
      console.error(`Neon DB insert error on ${table}:`, err);
    }

    if (!inserted) {
      const all = memCache.get(storeName) || [];
      const nextId = all.length > 0 ? Math.max(...all.map(i => Number(i.id) || 0)) + 1 : 1;
      inserted = {
        ...item,
        id: item.id || nextId,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    // Invalidate and update caches
    if (memCache.has(storeName)) {
      const list = memCache.get(storeName);
      memCache.set(storeName, [...list, inserted]);
    }
    syncToLocalCache(storeName, memCache.get(storeName) || [inserted]);

    return inserted;
  },

  bulkInsert: async (storeName, items) => {
    if (!items || items.length === 0) return [];
    const table = TABLE_MAP[storeName] || storeName;

    try {
      const sample = items[0];
      const keys = Object.keys(sample).filter(k => k !== 'id');
      const chunkSize = 150;
      const insertedAll = [];

      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const rowsStr = chunk.map(item => {
          const vals = keys.map(k => formatSqlValue(item[k], k));
          return `(${vals.join(', ')})`;
        }).join(',\n');

        const queryStr = `INSERT INTO ${table} (${keys.join(', ')}) VALUES ${rowsStr} RETURNING *`;
        const res = await sql.query(queryStr);
        if (Array.isArray(res)) {
          insertedAll.push(...res);
        }
      }

      memCache.delete(storeName);
      return insertedAll.length > 0 ? insertedAll : items;
    } catch (err) {
      console.error(`Neon DB bulkInsert error on ${table}:`, err);
      memCache.delete(storeName);
      return items;
    }
  },

  update: async (storeName, id, updates) => {
    const table = TABLE_MAP[storeName] || storeName;
    const numId = Number(id);

    const cleanUpdates = { ...updates };
    if (table === 'users') {
      if (cleanUpdates.password !== undefined && !cleanUpdates.password_hash) {
        cleanUpdates.password_hash = cleanUpdates.password;
      }
      delete cleanUpdates.password;
    }

    const updateKeys = Object.keys(cleanUpdates).filter(k => k !== 'id');
    const setClause = updateKeys.map(k => `${k} = ${formatSqlValue(cleanUpdates[k], k)}`).join(', ');

    let updated = null;
    try {
      const queryStr = `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ${numId} RETURNING *`;
      const res = await sql.query(queryStr);
      if (res && res[0]) {
        updated = res[0];
      }
    } catch (err) {
      console.error(`Neon DB update error on ${table}:`, err);
    }

    if (!updated) {
      const existing = (memCache.get(storeName) || []).find(i => Number(i.id) === numId) || {};
      updated = { ...existing, ...updates, id: numId, updated_at: new Date().toISOString() };
    }

    // Update in-memory cache
    if (memCache.has(storeName)) {
      const list = memCache.get(storeName).map(i => Number(i.id) === numId ? { ...i, ...updated } : i);
      memCache.set(storeName, list);
      syncToLocalCache(storeName, list);
    }

    return updated;
  },

  delete: async (storeName, id) => {
    const table = TABLE_MAP[storeName] || storeName;
    const numId = Number(id);

    try {
      await sql.query(`DELETE FROM ${table} WHERE id = ${numId}`);
    } catch {
      // Fallback
    }

    if (memCache.has(storeName)) {
      const list = memCache.get(storeName).filter(i => Number(i.id) !== numId);
      memCache.set(storeName, list);
      syncToLocalCache(storeName, list);
    }
    return true;
  },

  clear: async (storeName) => {
    const table = TABLE_MAP[storeName] || storeName;
    try {
      await sql.query(`DELETE FROM ${table}`);
    } catch {
      // Fallback
    }
    memCache.delete(storeName);
    try {
      const db = await openDatabase();
      if (db) {
        const tx = db.transaction([storeName], 'readwrite');
        tx.objectStore(storeName).clear();
      }
    } catch {}
    return true;
  }
};
