import * as XLSX from 'xlsx';
import { dbOps } from '../db/database';
import { activityService } from './activityService';
import { authService } from './authService';

// In-memory import sessions cache
const importSessions = new Map();

// Column alias mappings for Recruiter Excel Import
const RECRUITER_COLUMN_MAP = {
  company_name: ['company_name', 'company', 'institution', 'college', 'college_name', 'organization', 'vendor', 'name_of_the_institution', 'institution_name'],
  recruiter_name: ['recruiter_name', 'spoc', 'spoc_name', 'contact_person', 'contact_name', 'placement_officer', 'principal', 'coordinator', 'hr_name'],
  designation: ['designation', 'role', 'title', 'spoc_designation', 'position'],
  mobile: ['mobile', 'phone', 'contact_number', 'mobile_number', 'phone_number', 'contact_no', 'cell'],
  alternate_mobile: ['alternate_mobile', 'alt_mobile', 'alt_phone', 'alternate_phone', 'secondary_phone'],
  email: ['email', 'email_id', 'mail', 'mail_id', 'official_email', 'contact_email'],
  website: ['website', 'web', 'url', 'site', 'official_website'],
  address: ['address', 'street', 'location_address', 'full_address'],
  district: ['district', 'city', 'location', 'region', 'zone'],
  taluk: ['taluk', 'town', 'area', 'zone_area'],
  state: ['state', 'province'],
  industry: ['industry', 'category', 'institution_type', 'type', 'sector', 'stream'],
  job_role: ['job_role', 'role_offered', 'positions', 'courses', 'programs', 'job_title'],
  candidates_required: ['candidates_required', 'student_count', 'strength', 'capacity', 'intake', 'vacancy', 'openings'],
  lead_source: ['lead_source', 'source', 'channel', 'sourcing_channel'],
  status: ['status', 'lead_status', 'stage']
};

export const recruiterService = {
  getRecruiters: async (params = {}) => {
    const currentUser = authService.getSessionUser();
    const isPrivileged = authService.isPrivilegedUser(currentUser);

    const [recruiters, users] = await Promise.all([
      dbOps.getAll('recruiters'),
      dbOps.getAll('users')
    ]);

    const userMap = {};
    users.forEach((u) => { userMap[u.id] = u.name; });

    let filtered = [...recruiters];

    // Recruiter-Wise Access Control:
    // Non-privileged users (RECRUITER / STAFF) see ONLY partners/leads assigned to them
    if (!isPrivileged && currentUser?.id) {
      filtered = filtered.filter((r) => Number(r.assigned_to) === Number(currentUser.id));
    } else if (params.assigned_to) {
      filtered = filtered.filter((r) => Number(r.assigned_to) === Number(params.assigned_to));
    }

    // Multi-field search
    if (params.search && params.search.trim()) {
      const term = params.search.trim().toLowerCase();
      filtered = filtered.filter((r) =>
        (r.lead_id && r.lead_id.toLowerCase().includes(term)) ||
        (r.company_name && r.company_name.toLowerCase().includes(term)) ||
        (r.recruiter_name && r.recruiter_name.toLowerCase().includes(term)) ||
        (r.mobile && r.mobile.toLowerCase().includes(term)) ||
        (r.email && r.email.toLowerCase().includes(term)) ||
        (r.district && r.district.toLowerCase().includes(term)) ||
        (r.job_role && r.job_role.toLowerCase().includes(term)) ||
        (r.industry && r.industry.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter((r) => r.status === params.status);
    }

    // District filter
    if (params.district && params.district !== 'ALL') {
      filtered = filtered.filter((r) => (r.district || '').toLowerCase() === params.district.toLowerCase());
    }

    // Lead source filter
    if (params.lead_source && params.lead_source !== 'ALL') {
      filtered = filtered.filter((r) => (r.lead_source || '').toLowerCase() === params.lead_source.toLowerCase());
    }

    // Industry / Category filter with subcategories
    if (params.industry && params.industry !== 'ALL') {
      const indVal = params.industry.trim().toLowerCase();
      if (['college', 'colleges'].includes(indVal)) {
        filtered = filtered.filter((r) => {
          const ind = (r.industry || '').toLowerCase();
          return ind.includes('college') || ind.includes('arts') || ind.includes('engineering') || ind.includes('pharmacy') || ind.includes('medical') || ind.includes('polytech') || ind.includes('iti');
        });
      } else if (['training center', 'training centers'].includes(indVal)) {
        filtered = filtered.filter((r) => {
          const ind = (r.industry || '').toLowerCase();
          return ind.includes('training') || ind.includes('skill') || ind.includes('centre') || ind.includes('center') || ind.includes('institute') || ind.includes('academy') || ind.includes('vocational');
        });
      } else if (['ngo & community', 'ngo'].includes(indVal)) {
        filtered = filtered.filter((r) => {
          const ind = (r.industry || '').toLowerCase();
          return ind.includes('ngo') || ind.includes('trust') || ind.includes('foundation') || ind.includes('society') || ind.includes('community');
        });
      } else if (['vendors', 'vendor'].includes(indVal)) {
        filtered = filtered.filter((r) => {
          const ind = (r.industry || '').toLowerCase();
          return ind.includes('vendor') || ind.includes('agency') || ind.includes('consultancy');
        });
      } else {
        filtered = filtered.filter((r) => (r.industry || '').toLowerCase().includes(indVal));
      }
    }


    // Sorting
    const sortBy = params.sort_by || 'id';
    const sortOrder = (params.sort_order || 'asc').toLowerCase();

    filtered.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'id') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (sortBy === 'candidates_required') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const page = Number(params.page) || 1;
    const pageSize = Number(params.page_size) || 10;
    const total = filtered.length;
    const offset = (page - 1) * pageSize;

    const items = filtered.slice(offset, offset + pageSize).map((r) => ({
      ...r,
      assigned_user_name: userMap[r.assigned_to] || 'Unassigned',
      sourced_user_name: userMap[r.sourced_by] || null,
      creator_name: userMap[r.created_by] || null
    }));

    const total_pages = Math.ceil(total / pageSize) || 1;

    return { items, total, page, page_size: pageSize, total_pages };
  },

  getRecruiterById: async (id) => {
    const currentUser = authService.getSessionUser();
    const isPrivileged = authService.isPrivilegedUser(currentUser);

    const [recruiter, users, followUps, comms, statusHistory] = await Promise.all([
      dbOps.getById('recruiters', id),
      dbOps.getAll('users'),
      dbOps.getAll('follow_ups'),
      dbOps.getAll('communications'),
      dbOps.getAll('status_history')
    ]);

    if (!recruiter) {
      throw { response: { data: { detail: 'Recruiter not found' }, status: 404 } };
    }

    // Direct URL Access Control
    if (!isPrivileged && currentUser?.id && Number(recruiter.assigned_to) !== Number(currentUser.id)) {
      throw {
        response: {
          status: 403,
          data: { detail: 'Access Denied: You do not have permission to view or manage this partner.' }
        }
      };
    }

    const userMap = {};
    users.forEach((u) => { userMap[u.id] = u.name; });

    const relatedFollowUps = followUps.filter((f) => Number(f.recruiter_id) === Number(id));
    const relatedComms = comms.filter((c) => Number(c.recruiter_id) === Number(id));
    const relatedStatusHistory = statusHistory
      .filter((s) => Number(s.recruiter_id) === Number(id))
      .map((s) => ({ ...s, changed_by_name: userMap[s.changed_by] || 'Staff Member' }));

    return {
      ...recruiter,
      assigned_user_name: userMap[recruiter.assigned_to] || 'Unassigned',
      sourced_user_name: userMap[recruiter.sourced_by] || 'Unassigned',
      creator_name: userMap[recruiter.created_by] || 'System',
      follow_ups: relatedFollowUps,
      communications: relatedComms,
      status_history: relatedStatusHistory
    };
  },

  createRecruiter: async (data) => {
    const currentUser = authService.getSessionUser();
    const isPrivileged = authService.isPrivilegedUser(currentUser);

    const all = await dbOps.getAll('recruiters');
    const nextNum = all.length + 1;
    const lead_id = `REC-${String(nextNum).padStart(6, '0')}`;

    const assignedTo = isPrivileged
      ? (data.assigned_to ? Number(data.assigned_to) : currentUser?.id || null)
      : (currentUser?.id || null);

    const newLead = await dbOps.insert('recruiters', {
      ...data,
      lead_id,
      status: data.status || 'YET_TO_CONNECT',
      assigned_to: assignedTo,
      created_by: currentUser?.id || null,
      sourced_by: data.sourced_by || currentUser?.id || null
    });

    await dbOps.insert('status_history', {
      recruiter_id: newLead.id,
      old_status: null,
      new_status: newLead.status,
      remarks: 'Initial lead record created',
      changed_by: currentUser?.id || 1,
      changed_at: new Date().toISOString()
    });

    await activityService.log('Lead Created', 'Leads', newLead.lead_id, `Created recruiter lead for ${newLead.company_name}`);
    return newLead;
  },

  updateRecruiter: async (id, data) => {
    const currentUser = authService.getSessionUser();
    const isPrivileged = authService.isPrivilegedUser(currentUser);

    const existing = await dbOps.getById('recruiters', id);
    if (!existing) {
      throw { response: { data: { detail: 'Recruiter not found' }, status: 404 } };
    }

    if (!isPrivileged && currentUser?.id && Number(existing.assigned_to) !== Number(currentUser.id)) {
      throw {
        response: {
          status: 403,
          data: { detail: 'Access Denied: You do not have permission to modify this partner.' }
        }
      };
    }

    const payload = { ...data };
    if (!isPrivileged) {
      delete payload.assigned_to;
    }

    const updated = await dbOps.update('recruiters', id, payload);
    await activityService.log('Lead Updated', 'Leads', updated.lead_id, `Updated details for ${updated.company_name}`);
    return updated;
  },

  updateStatus: async (id, status, remarks = '') => {
    const currentUser = authService.getSessionUser();
    const isPrivileged = authService.isPrivilegedUser(currentUser);

    const existing = await dbOps.getById('recruiters', id);
    if (!existing) throw new Error('Lead not found');

    if (!isPrivileged && currentUser?.id && Number(existing.assigned_to) !== Number(currentUser.id)) {
      throw {
        response: {
          status: 403,
          data: { detail: 'Access Denied: You do not have permission to update this partner status.' }
        }
      };
    }

    const oldStatus = existing.status;
    const updated = await dbOps.update('recruiters', id, {
      status,
      last_contacted_date: new Date().toISOString(),
      remarks: remarks || existing.remarks
    });

    await dbOps.insert('status_history', {
      recruiter_id: Number(id),
      old_status: oldStatus,
      new_status: status,
      remarks: remarks || `Status changed from ${oldStatus} to ${status}`,
      changed_by: currentUser?.id || 1,
      changed_at: new Date().toISOString()
    });

    await activityService.log('Status Changed', 'Leads', updated.lead_id, `Changed status from ${oldStatus} to ${status}`);
    return updated;
  },

  getStatusHistory: async (id) => {
    const [history, users] = await Promise.all([
      dbOps.getAll('status_history'),
      dbOps.getAll('users')
    ]);

    const userMap = {};
    users.forEach((u) => { userMap[u.id] = u.name; });

    return history
      .filter((h) => Number(h.recruiter_id) === Number(id))
      .map((h) => ({
        ...h,
        changed_by_name: userMap[h.changed_by] || 'Staff Member'
      }))
      .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
  },

  deleteRecruiter: async (id) => {
    const currentUser = authService.getSessionUser();
    const isPrivileged = authService.isPrivilegedUser(currentUser);

    const existing = await dbOps.getById('recruiters', id);
    if (!existing) {
      throw { response: { data: { detail: 'Recruiter not found' }, status: 404 } };
    }

    if (!isPrivileged && currentUser?.id && Number(existing.assigned_to) !== Number(currentUser.id)) {
      throw {
        response: {
          status: 403,
          data: { detail: 'Access Denied: You do not have permission to delete this partner.' }
        }
      };
    }

    await dbOps.delete('recruiters', id);
    await activityService.log('Lead Deleted', 'Leads', existing.lead_id, `Deleted lead ${existing.company_name}`);
    return { message: 'Lead deleted successfully' };
  },

  // Client-Side Excel Import Preview using SheetJS
  previewImport: async (formDataOrFile) => {
    const file = formDataOrFile instanceof File
      ? formDataOrFile
      : formDataOrFile.get ? formDataOrFile.get('file') : formDataOrFile;

    if (!file) throw new Error('No file provided for import');

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (rawRows.length === 0) {
      throw { response: { data: { detail: 'Uploaded sheet contains no data rows.' } } };
    }

    const existingRecruiters = await dbOps.getAll('recruiters');
    const existingMobiles = new Set(existingRecruiters.map((r) => (r.mobile || '').replace(/\D/g, '')).filter(Boolean));
    const existingNames = new Set(existingRecruiters.map((r) => (r.company_name || '').toLowerCase().trim()).filter(Boolean));

    const normalizeHeader = (header) => header.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').trim();

    const parsedRows = [];
    const duplicates = [];
    const validRows = [];

    rawRows.forEach((row, idx) => {
      const normalizedRow = {};
      Object.keys(row).forEach((key) => {
        normalizedRow[normalizeHeader(key)] = String(row[key] || '').trim();
      });

      const extracted = {};
      Object.keys(RECRUITER_COLUMN_MAP).forEach((field) => {
        const aliases = RECRUITER_COLUMN_MAP[field];
        for (const alias of aliases) {
          if (normalizedRow[alias] !== undefined && normalizedRow[alias] !== '') {
            extracted[field] = normalizedRow[alias];
            break;
          }
        }
      });

      if (extracted.company_name) {
        const cleanMobile = (extracted.mobile || '').replace(/\D/g, '');
        const cleanName = extracted.company_name.toLowerCase().trim();

        const isDuplicate = (cleanMobile && existingMobiles.has(cleanMobile)) || (cleanName && existingNames.has(cleanName));

        const item = {
          row_index: idx + 2,
          company_name: extracted.company_name,
          recruiter_name: extracted.recruiter_name || 'Placement Officer',
          designation: extracted.designation || 'Placement SPOC',
          mobile: extracted.mobile || 'N/A',
          alternate_mobile: extracted.alternate_mobile || '',
          email: extracted.email || '',
          website: extracted.website || '',
          district: extracted.district || 'Tamil Nadu',
          industry: extracted.industry || 'College',
          job_role: extracted.job_role || '',
          candidates_required: Number(extracted.candidates_required) || 0,
          lead_source: extracted.lead_source || 'Excel Import',
          status: 'YET_TO_CONNECT',
          is_duplicate: isDuplicate
        };

        parsedRows.push(item);
        if (isDuplicate) duplicates.push(item);
        else validRows.push(item);
      }
    });

    const sessionId = `import_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    importSessions.set(sessionId, { parsedRows, validRows, duplicates });

    return {
      session_id: sessionId,
      total_rows: parsedRows.length,
      valid_rows: validRows.length,
      duplicate_rows: duplicates.length,
      preview_data: parsedRows.slice(0, 10),
      duplicates: duplicates.slice(0, 10)
    };
  },

  // Client-Side Excel Import Confirm
  confirmImport: async (sessionId, skipDuplicates = true) => {
    const session = importSessions.get(sessionId);
    if (!session) {
      throw { response: { data: { detail: 'Import session expired or invalid. Please re-upload the file.' } } };
    }

    const rowsToImport = skipDuplicates ? session.validRows : session.parsedRows;
    const allRecruiters = await dbOps.getAll('recruiters');
    let currentId = allRecruiters.length;

    const savedUser = localStorage.getItem('user');
    const user = savedUser ? JSON.parse(savedUser) : null;

    const itemsToInsert = rowsToImport.map((r) => {
      currentId += 1;
      return {
        id: currentId,
        lead_id: `REC-${String(currentId).padStart(6, '0')}`,
        company_name: r.company_name,
        recruiter_name: r.recruiter_name,
        designation: r.designation,
        mobile: r.mobile,
        alternate_mobile: r.alternate_mobile,
        email: r.email,
        website: r.website,
        district: r.district,
        state: 'Tamil Nadu',
        industry: r.industry,
        job_role: r.job_role,
        candidates_required: r.candidates_required,
        lead_source: r.lead_source,
        status: 'YET_TO_CONNECT',
        created_by: user?.id || 1,
        sourced_by: user?.id || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    await dbOps.bulkInsert('recruiters', itemsToInsert);
    importSessions.delete(sessionId);

    await activityService.log('Bulk Import', 'Import', `${itemsToInsert.length} leads`, `Imported ${itemsToInsert.length} institution leads from Excel`);

    return {
      imported_count: itemsToInsert.length,
      skipped_count: session.parsedRows.length - itemsToInsert.length,
      message: `Successfully imported ${itemsToInsert.length} records.`
    };
  },

  // Client-Side Excel Export Generator
  exportRecruiters: async (format = 'xlsx', filters = {}) => {
    const res = await recruiterService.getRecruiters({ ...filters, page: 1, page_size: 50000 });
    const leads = res.items || [];

    const exportRows = leads.map((r, idx) => ({
      '#': idx + 1,
      'Lead ID': r.lead_id,
      'Institution / Vendor Name': r.company_name,
      'SPOC / Recruiter Name': r.recruiter_name || '',
      'Designation': r.designation || '',
      'Mobile Number': r.mobile || '',
      'Alternate Mobile': r.alternate_mobile || '',
      'Email ID': r.email || '',
      'District': r.district || '',
      'State': r.state || 'Tamil Nadu',
      'Category / Industry': r.industry || '',
      'Candidates Required / Capacity': r.candidates_required || '',
      'Programs / Job Role': r.job_role || '',
      'Sourcing Channel': r.lead_source || '',
      'Status': r.status || 'YET_TO_CONNECT',
      'Assigned Owner': r.assigned_user_name || 'Unassigned',
      'Created Date': r.created_at ? r.created_at.split('T')[0] : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Colleges & Vendors');

    const timestamp = Date.now();
    const filename = `institutions_vendors_${timestamp}.${format === 'csv' ? 'csv' : 'xlsx'}`;

    XLSX.writeFile(wb, filename);
    await activityService.log('Export Generated', 'Export', `${leads.length} records`, `Exported ${leads.length} institution leads as ${format.toUpperCase()}`);
    return { success: true, filename };
  },

  exportRecruitersUrl: (format = 'xlsx', filters = {}) => {
    // Returns a javascript trigger link
    return `#export-${format}`;
  }
};
