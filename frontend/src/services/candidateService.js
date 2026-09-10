import * as XLSX from 'xlsx';
import { dbOps } from '../db/database';
import { activityService } from './activityService';
import { authService } from './authService';

// Column alias mappings for Candidate Excel Import
const CANDIDATE_COLUMN_MAP = {
  name: ['name', 'candidate_name', 'student_name', 'full_name', 'applicant_name', 'name_of_candidate'],
  contact_number: ['contact_number', 'mobile', 'phone', 'contact_no', 'mobile_no', 'phone_number', 'contact', 'mobile_number'],
  alternate_mobile: ['alternate_mobile', 'alt_mobile', 'alt_phone', 'secondary_phone', 'alternate_no'],
  email: ['email', 'email_id', 'mail', 'mail_id', 'email_address'],
  location: ['location', 'city', 'district', 'native_location', 'native_district', 'address'],
  state: ['state'],
  educational_qualification: ['educational_qualification', 'qualification', 'degree', 'education', 'highest_qualification'],
  specialization: ['specialization', 'department', 'branch', 'stream', 'course', 'major'],
  college_name: ['college_name', 'college', 'institution', 'institute', 'university'],
  year_of_passout: ['year_of_passout', 'passout_year', 'yop', 'year_of_passing', 'batch', 'passed_out_year'],
  position_interested_in: ['position_interested_in', 'position', 'job_role', 'role_interested', 'interested_role', 'domain'],
  willing_to_relocate: ['willing_to_relocate', 'relocate', 'relocation'],
  experience_type: ['experience_type', 'experience', 'fresher_or_experienced', 'fresher_experienced'],
  total_years_experience: ['total_years_experience', 'total_experience', 'years_of_experience', 'exp_years'],
  designation_worked: ['designation_worked', 'designation', 'previous_role', 'current_designation'],
  current_ctc: ['current_ctc', 'ctc', 'present_salary'],
  expected_ctc: ['expected_ctc', 'exp_ctc', 'expected_salary'],
  status: ['status'],
  remarks: ['remarks', 'notes', 'comments']
};

export const candidateService = {
  getCandidates: async (params = {}) => {
    const currentUser = authService.getSessionUser();
    const isPrivileged = authService.isPrivilegedUser(currentUser);

    const [candidates, users] = await Promise.all([
      dbOps.getAll('candidates'),
      dbOps.getAll('users')
    ]);

    const userMap = {};
    users.forEach((u) => { userMap[u.id] = u.name; });

    let filtered = [...candidates];

    // Candidate data visibility:
    // All candidates are visible to all recruiters.
    // Optional filtering by assigned_to is supported for all users:
    if (params.assigned_to) {
      filtered = filtered.filter((c) => Number(c.assigned_to) === Number(params.assigned_to));
    }

    // Multi-field search
    if (params.search && params.search.trim()) {
      const term = params.search.trim().toLowerCase();
      filtered = filtered.filter((c) =>
        (c.candidate_id && c.candidate_id.toLowerCase().includes(term)) ||
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.contact_number && c.contact_number.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.location && c.location.toLowerCase().includes(term)) ||
        (c.college_name && c.college_name.toLowerCase().includes(term)) ||
        (c.specialization && c.specialization.toLowerCase().includes(term)) ||
        (c.position_interested_in && c.position_interested_in.toLowerCase().includes(term)) ||
        (c.educational_qualification && c.educational_qualification.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter((c) => (c.status || '').toUpperCase() === params.status.toUpperCase());
    }

    // Location / District filter
    if (params.location && params.location !== 'ALL') {
      filtered = filtered.filter((c) => (c.location || '').toLowerCase().includes(params.location.toLowerCase()));
    }

    // Qualification filter with smart degree aliases
    if (params.qualification && params.qualification !== 'ALL') {
      const qVal = params.qualification.trim().toLowerCase();
      if (['b.e/b.tech', 'be', 'btech', 'engineering'].includes(qVal)) {
        filtered = filtered.filter((c) => {
          const q = (c.educational_qualification || '').toLowerCase();
          return q.includes('b.e') || q.includes('b.tech') || q.includes('engineering') || q.includes('be') || q.includes('btech');
        });
      } else if (['arts & science', 'arts and science', 'arts'].includes(qVal)) {
        filtered = filtered.filter((c) => {
          const q = (c.educational_qualification || '').toLowerCase();
          return q.includes('arts') || q.includes('b.sc') || q.includes('b.com') || q.includes('bba') || q.includes('bca') || q.includes('ba');
        });
      } else if (['diploma', 'polytechnic'].includes(qVal)) {
        filtered = filtered.filter((c) => {
          const q = (c.educational_qualification || '').toLowerCase();
          return q.includes('diploma') || q.includes('polytechnic');
        });
      } else if (['iti'].includes(qVal)) {
        filtered = filtered.filter((c) => {
          const q = (c.educational_qualification || '').toLowerCase();
          return q.includes('iti');
        });
      } else if (['post graduate', 'pg', 'master'].includes(qVal)) {
        filtered = filtered.filter((c) => {
          const q = (c.educational_qualification || '').toLowerCase();
          return q.includes('m.e') || q.includes('m.tech') || q.includes('mba') || q.includes('mca') || q.includes('m.sc') || q.includes('m.com') || q.includes('ma');
        });
      } else {
        filtered = filtered.filter((c) => (c.educational_qualification || '').toLowerCase().includes(qVal));
      }
    }

    // Experience type filter
    if (params.experience_type && params.experience_type !== 'ALL') {
      const expVal = params.experience_type.trim().toLowerCase();
      filtered = filtered.filter((c) => (c.experience_type || '').toLowerCase().includes(expVal));
    }

    // Passout year filter
    if (params.passout_year && params.passout_year !== 'ALL') {
      filtered = filtered.filter((c) => (c.year_of_passout || '').toString().includes(params.passout_year.toString()));
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

    const items = filtered.slice(offset, offset + pageSize).map((c) => ({
      ...c,
      assigned_user_name: userMap[c.assigned_to] || 'Unassigned',
      creator_name: userMap[c.created_by] || 'System'
    }));

    const total_pages = Math.ceil(total / pageSize) || 1;

    return { items, total, page, page_size: pageSize, total_pages };
  },

  getCandidateById: async (id) => {
    const [candidate, users] = await Promise.all([
      dbOps.getById('candidates', id),
      dbOps.getAll('users')
    ]);

    if (!candidate) {
      throw { response: { data: { detail: 'Candidate not found' }, status: 404 } };
    }

    const userMap = {};
    users.forEach((u) => { userMap[u.id] = u.name; });

    return {
      ...candidate,
      assigned_user_name: userMap[candidate.assigned_to] || 'Unassigned',
      creator_name: userMap[candidate.created_by] || 'System'
    };
  },

  createCandidate: async (data) => {
    const currentUser = authService.getSessionUser();

    const all = await dbOps.getAll('candidates');

    // Duplicate check on Mobile and Email
    const cleanMobile = (data.contact_number || '').replace(/\D/g, '');
    const cleanEmail = (data.email || '').trim().toLowerCase();

    const duplicate = all.find((c) => {
      const cMobile = (c.contact_number || '').replace(/\D/g, '');
      const cEmail = (c.email || '').trim().toLowerCase();
      return (cleanMobile && cMobile && cMobile === cleanMobile) || (cleanEmail && cEmail && cEmail === cleanEmail);
    });

    if (duplicate) {
      const msg = `Candidate with mobile '${data.contact_number}' or email '${data.email}' already exists (${duplicate.candidate_id}: ${duplicate.name}).`;
      const err = new Error(msg);
      err.response = { data: { detail: msg }, status: 400 };
      throw err;
    }

    let maxNum = 0;
    all.forEach(c => {
      const match = (c.candidate_id || '').match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = Math.max(all.length + 1, maxNum + 1);
    const candidate_id = `CAN-${String(nextNum).padStart(6, '0')}`;

    const assignedTo = data.assigned_to ? Number(data.assigned_to) : (currentUser?.id || null);

    const newCandidate = await dbOps.insert('candidates', {
      ...data,
      candidate_id,
      status: data.status || 'NEW',
      created_by: currentUser?.id || 1,
      assigned_to: assignedTo
    });

    await activityService.log('Candidate Registered', 'Candidates', newCandidate.candidate_id, `Registered candidate ${newCandidate.name}`);
    return newCandidate;
  },

  updateCandidate: async (id, data) => {
    const existing = await dbOps.getById('candidates', id);
    if (!existing) {
      throw { response: { data: { detail: 'Candidate not found' }, status: 404 } };
    }

    const all = await dbOps.getAll('candidates');
    const cleanMobile = (data.contact_number || '').replace(/\D/g, '');

    if (cleanMobile) {
      const conflict = all.find((c) => Number(c.id) !== Number(id) && (c.contact_number || '').replace(/\D/g, '') === cleanMobile);
      if (conflict) {
        throw { response: { data: { detail: `Mobile number is already registered to candidate ${conflict.candidate_id} (${conflict.name}).` } } };
      }
    }

    const payload = { ...data };
    if (payload.assigned_to !== undefined && payload.assigned_to !== '') {
      payload.assigned_to = Number(payload.assigned_to);
    }

    const updated = await dbOps.update('candidates', id, payload);
    await activityService.log('Candidate Updated', 'Candidates', updated.candidate_id, `Updated candidate ${updated.name}`);
    return updated;
  },

  updateStatus: async (id, payload) => {
    const existing = await dbOps.getById('candidates', id);
    if (!existing) {
      throw { response: { data: { detail: 'Candidate not found' }, status: 404 } };
    }

    const updated = await dbOps.update('candidates', id, {
      status: payload.status,
      remarks: payload.remarks
    });
    await activityService.log('Candidate Status Changed', 'Candidates', updated.candidate_id, `Changed candidate status to ${payload.status}`);
    return updated;
  },

  deleteCandidate: async (id) => {
    const existing = await dbOps.getById('candidates', id);
    if (!existing) {
      throw { response: { data: { detail: 'Candidate not found' }, status: 404 } };
    }

    await dbOps.delete('candidates', id);
    await activityService.log('Candidate Deleted', 'Candidates', existing.candidate_id, `Deleted candidate ${existing.name}`);
    return { message: 'Candidate deleted successfully' };
  },

  // Bulk Import Candidates using SheetJS
  importCandidates: async (formDataOrFile) => {
    const file = formDataOrFile instanceof File
      ? formDataOrFile
      : formDataOrFile.get ? formDataOrFile.get('file') : formDataOrFile;

    if (!file) throw new Error('No candidate file provided for import');

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (rawRows.length === 0) {
      throw { response: { data: { detail: 'Uploaded sheet contains no data rows.' } } };
    }

    const existingCandidates = await dbOps.getAll('candidates');
    const existingMobiles = new Set(existingCandidates.map((c) => (c.contact_number || '').replace(/\D/g, '')).filter(Boolean));
    const batchMobiles = new Set();

    const normalizeHeader = (header) => header.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').trim();

    let currentId = existingCandidates.length;
    const candidatesToInsert = [];
    let duplicateCount = 0;

    const savedUser = localStorage.getItem('user');
    const user = savedUser ? JSON.parse(savedUser) : null;

    rawRows.forEach((row) => {
      const normalizedRow = {};
      Object.keys(row).forEach((key) => {
        normalizedRow[normalizeHeader(key)] = String(row[key] || '').trim();
      });

      const extracted = {};
      Object.keys(CANDIDATE_COLUMN_MAP).forEach((field) => {
        const aliases = CANDIDATE_COLUMN_MAP[field];
        for (const alias of aliases) {
          if (normalizedRow[alias] !== undefined && normalizedRow[alias] !== '') {
            extracted[field] = normalizedRow[alias];
            break;
          }
        }
      });

      if (extracted.name && (extracted.contact_number || extracted.email)) {
        const cleanMobile = (extracted.contact_number || '').replace(/\D/g, '');

        if (cleanMobile && (existingMobiles.has(cleanMobile) || batchMobiles.has(cleanMobile))) {
          duplicateCount++;
          return;
        }

        if (cleanMobile) batchMobiles.add(cleanMobile);
        currentId += 1;

        candidatesToInsert.push({
          id: currentId,
          candidate_id: `CAND-${String(currentId).padStart(6, '0')}`,
          name: extracted.name,
          contact_number: extracted.contact_number || 'N/A',
          alternate_mobile: extracted.alternate_mobile || '',
          email: extracted.email || '',
          location: extracted.location || 'Tamil Nadu',
          state: extracted.state || 'Tamil Nadu',
          educational_qualification: extracted.educational_qualification || 'Degree',
          specialization: extracted.specialization || '',
          college_name: extracted.college_name || '',
          year_of_passout: extracted.year_of_passout || '',
          position_interested_in: extracted.position_interested_in || '',
          willing_to_relocate: extracted.willing_to_relocate || 'Yes',
          experience_type: extracted.experience_type || 'Fresher',
          total_years_experience: extracted.total_years_experience || '',
          designation_worked: extracted.designation_worked || '',
          current_ctc: extracted.current_ctc || '',
          expected_ctc: extracted.expected_ctc || '',
          status: 'NEW',
          remarks: extracted.remarks || '',
          assigned_to: user?.id || null,
          created_by: user?.id || 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });

    if (candidatesToInsert.length > 0) {
      await dbOps.bulkInsert('candidates', candidatesToInsert);
      await activityService.log('Bulk Candidate Import', 'Candidates', `${candidatesToInsert.length} candidates`, `Imported ${candidatesToInsert.length} candidates from Excel`);
    }

    return {
      success: true,
      total_rows: rawRows.length,
      imported: candidatesToInsert.length,
      duplicates_skipped: duplicateCount,
      message: `Import completed: ${candidatesToInsert.length} candidates imported, ${duplicateCount} duplicates skipped.`
    };
  },

  // Client-Side Excel Export Generator
  exportCandidates: async (format = 'xlsx', filters = {}) => {
    const res = await candidateService.getCandidates({ ...filters, page: 1, page_size: 50000 });
    const candidates = res.items || [];

    const exportRows = candidates.map((c, idx) => ({
      '#': idx + 1,
      'Candidate ID': c.candidate_id,
      'Candidate Name': c.name,
      'Contact Number': c.contact_number,
      'Alternate Mobile': c.alternate_mobile || '',
      'Email ID': c.email || '',
      'Location / District': c.location || '',
      'State': c.state || 'Tamil Nadu',
      'Qualification': c.educational_qualification || '',
      'Specialization / Department': c.specialization || '',
      'College / Institution': c.college_name || '',
      'Year of Passout': c.year_of_passout || '',
      'Position Interested In': c.position_interested_in || '',
      'Willing to Relocate': c.willing_to_relocate || 'Yes',
      'Experience Type': c.experience_type || 'Fresher',
      'Total Experience (Years)': c.total_years_experience || '',
      'Previous Designation': c.designation_worked || '',
      'Current CTC': c.current_ctc || '',
      'Expected CTC': c.expected_ctc || '',
      'Status': c.status || 'NEW',
      'Remarks': c.remarks || '',
      'Assigned Staff': c.assigned_user_name || 'Unassigned',
      'Registration Date': c.created_at ? c.created_at.split('T')[0] : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');

    const timestamp = Date.now();
    const filename = `candidates_pool_${timestamp}.${format === 'csv' ? 'csv' : 'xlsx'}`;

    XLSX.writeFile(wb, filename);
    await activityService.log('Export Generated', 'Export', `${candidates.length} candidates`, `Exported ${candidates.length} candidates as ${format.toUpperCase()}`);
    return { success: true, filename };
  },

  exportCandidatesUrl: (format = 'xlsx', filters = {}) => {
    return `#export-candidates-${format}`;
  }
};
