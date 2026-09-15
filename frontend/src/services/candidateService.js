import * as XLSX from 'xlsx';
import { dbOps } from '../db/database';
import { activityService } from './activityService';
import { authService } from './authService';
import { recruiterActivityService } from './recruiterActivityService';

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

    // Recruiter-Wise Access Control:
    // Non-privileged users (RECRUITER / STAFF) see ONLY candidates assigned to them
    if (!isPrivileged && currentUser?.id) {
      filtered = filtered.filter((c) => Number(c.assigned_to) === Number(currentUser.id));
    } else if (params.assigned_to) {
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

    // Qualification filter with comprehensive degree aliases
    if (params.qualification && params.qualification !== 'ALL') {
      const f = params.qualification.trim().toLowerCase();
      filtered = filtered.filter((cand) => {
        const c = (cand.educational_qualification || '').toLowerCase().trim();
        if (!c) return false;

        // Engineering / Technology
        if (f.includes('b.e') || f.includes('engineering') || f.includes('btech') || f.includes('b.tech')) {
          return c.includes('b.e') || c.includes('b.tech') || c.includes('b. tech') || c.includes('engineering') || c.includes('btech') || c === 'be' || c.startsWith('be ');
        }
        // Polytechnic / Diploma
        if (f.includes('diploma') || f.includes('polytechnic')) {
          return c.includes('diploma') || c.includes('polytechnic');
        }
        // ITI
        if (f.includes('iti')) {
          return c.includes('iti');
        }
        // Science degrees (B.Sc, M.Sc)
        if (f.includes('b.sc') || f.includes('m.sc') || f.includes('science')) {
          return c.includes('b.sc') || c.includes('m.sc') || c.includes('b. sc') || c.includes('bsc') || c.includes('msc') || c.includes('science');
        }
        // Commerce degrees (B.Com, M.Com)
        if (f.includes('b.com') || f.includes('m.com') || f.includes('commerce')) {
          return c.includes('b.com') || c.includes('m.com') || c.includes('bcom') || c.includes('mcom') || c.includes('commerce');
        }
        // Management (BBA, MBA)
        if (f.includes('bba') || f.includes('mba') || f.includes('management')) {
          return c.includes('bba') || c.includes('mba') || c.includes('management');
        }
        // Computer Applications (BCA, MCA)
        if (f.includes('bca') || f.includes('mca') || f.includes('computer')) {
          return c.includes('bca') || c.includes('mca');
        }
        // Arts & Humanities (B.A, M.A)
        if (f.includes('b.a') || f.includes('m.a') || f.includes('arts') || f.includes('humanities')) {
          return c.includes('b.a') || c.includes('m.a') || c.includes('ba') || c.includes('arts') || c.includes('humanities');
        }
        // Higher Secondary / 12th
        if (f.includes('12th') || f.includes('higher secondary') || f.includes('puc') || f.includes('hsc')) {
          return c.includes('12th') || c.includes('hsc') || c.includes('puc') || c.includes('higher secondary');
        }
        // SSLC / 10th
        if (f.includes('10th') || f.includes('sslc')) {
          return c.includes('10th') || c.includes('sslc');
        }
        // Other degrees
        if (f.includes('other')) {
          return !c.includes('b.e') && !c.includes('b.tech') && !c.includes('diploma') && !c.includes('iti') && !c.includes('b.sc') && !c.includes('b.com') && !c.includes('bba') && !c.includes('mba') && !c.includes('bca') && !c.includes('mca') && !c.includes('b.a');
        }

        return c.includes(f);
      });
    }

    // Experience type filter
    if (params.experience_type && params.experience_type !== 'ALL') {
      const expVal = params.experience_type.trim().toLowerCase();
      filtered = filtered.filter((c) => {
        const val = (c.experience_type || '').toLowerCase();
        if (expVal.includes('fresher')) return val.includes('fresher');
        if (expVal.includes('experienced')) return val.includes('experienced');
        return val.includes(expVal);
      });
    }

    // Passout year filter
    if (params.passout_year && params.passout_year !== 'ALL') {
      const yStr = params.passout_year.toString();
      const matchYear = yStr.match(/\d{4}/);
      if (yStr.toLowerCase().includes('before')) {
        const year = matchYear ? parseInt(matchYear[0], 10) : 2020;
        filtered = filtered.filter((c) => {
          const y = parseInt(c.year_of_passout, 10);
          return !isNaN(y) && y < year;
        });
      } else if (matchYear) {
        filtered = filtered.filter((c) => (c.year_of_passout || '').toString().includes(matchYear[0]));
      } else {
        filtered = filtered.filter((c) => (c.year_of_passout || '').toString().includes(yStr));
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
    const currentUser = authService.getSessionUser();
    const isPrivileged = authService.isPrivilegedUser(currentUser);

    const [candidate, users] = await Promise.all([
      dbOps.getById('candidates', id),
      dbOps.getAll('users')
    ]);

    if (!candidate) {
      throw { response: { data: { detail: 'Candidate not found' }, status: 404 } };
    }

    // Direct URL Access Control:
    // If not admin/HR and candidate is not assigned to this recruiter, DENY ACCESS
    if (!isPrivileged && currentUser?.id && Number(candidate.assigned_to) !== Number(currentUser.id)) {
      throw {
        response: {
          status: 403,
          data: { detail: 'Access Denied: You do not have permission to view or manage this candidate.' }
        }
      };
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
    await recruiterActivityService.logActivity({
      recruiter_id: assignedTo || currentUser?.id,
      recruiter_name: currentUser?.name || 'Recruiter',
      action_type: 'Candidate added',
      candidate_id: newCandidate.candidate_id,
      candidate_name: newCandidate.name,
      job_name: newCandidate.position_interested_in || 'General Sourcing',
      previous_status: null,
      new_status: newCandidate.status || 'NEW',
      description: `Registered candidate ${newCandidate.name} into recruitment pipeline.`
    });

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
    const currentUser = authService.getSessionUser();
    
    await activityService.log('Candidate Updated', 'Candidates', updated.candidate_id, `Updated candidate ${updated.name}`);

    // If assignment changed
    if (payload.assigned_to && Number(payload.assigned_to) !== Number(existing.assigned_to)) {
      await recruiterActivityService.logActivity({
        recruiter_id: payload.assigned_to,
        recruiter_name: currentUser?.name || 'Recruiter',
        action_type: 'Candidate assigned',
        candidate_id: updated.candidate_id,
        candidate_name: updated.name,
        job_name: updated.position_interested_in || 'General Assignment',
        previous_status: existing.status,
        new_status: updated.status,
        description: `Candidate assigned to recruiter ID ${payload.assigned_to}.`
      });
    } else {
      await recruiterActivityService.logActivity({
        recruiter_id: updated.assigned_to || currentUser?.id,
        recruiter_name: currentUser?.name || 'Recruiter',
        action_type: 'Candidate updated',
        candidate_id: updated.candidate_id,
        candidate_name: updated.name,
        job_name: updated.position_interested_in || 'General Update',
        previous_status: existing.status,
        new_status: updated.status,
        description: `Updated profile details for candidate ${updated.name}.`
      });
    }

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

    const currentUser = authService.getSessionUser();
    await activityService.log('Candidate Status Changed', 'Candidates', updated.candidate_id, `Changed candidate status to ${payload.status}`);

    // Specific action type resolution
    const s = (payload.status || '').toUpperCase();
    let actionType = 'Candidate status changed';
    if (s === 'CONTACTED') actionType = 'Candidate contacted';
    else if (s === 'SHORTLISTED' || s === 'SCREENED') actionType = 'Candidate shortlisted';
    else if (s === 'INTERVIEW_SCHEDULED') actionType = 'Interview scheduled';
    else if (s === 'SELECTED') actionType = 'Candidate selected';
    else if (s === 'REJECTED') actionType = 'Candidate rejected';
    else if (s === 'JOINED' || s === 'PLACED') actionType = 'Candidate joined';

    await recruiterActivityService.logActivity({
      recruiter_id: existing.assigned_to || currentUser?.id,
      recruiter_name: currentUser?.name || 'Recruiter',
      action_type: actionType,
      candidate_id: existing.candidate_id,
      candidate_name: existing.name,
      job_name: existing.position_interested_in || 'General Pipeline',
      previous_status: existing.status,
      new_status: payload.status,
      description: payload.remarks || `Status transitioned from ${existing.status} to ${payload.status}`
    });

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
