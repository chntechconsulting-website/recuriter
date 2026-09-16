import { dbOps, sql, formatSqlValue } from '../db/database';
import { authService } from './authService';
import { recruiterActivityService } from './recruiterActivityService';

export const assignmentService = {
  // ==========================================
  // 1. COLLEGE ASSIGNMENTS
  // ==========================================

  /**
   * Get all college assignments with filtering, recruiter details, and pagination
   */
  getCollegeAssignments: async (params = {}) => {
    const [assignments, leads, users] = await Promise.all([
      dbOps.getAll('recruiter_college_assignments', { forceFresh: true }),
      dbOps.getAll('recruiters'),
      dbOps.getAll('users')
    ]);

    const leadMap = new Map();
    leads.forEach((l) => leadMap.set(Number(l.id), l));

    const userMap = new Map();
    users.forEach((u) => userMap.set(Number(u.id), u));

    let items = assignments.map((a) => {
      const college = leadMap.get(Number(a.college_id)) || {};
      const recruiter = userMap.get(Number(a.recruiter_id)) || {};
      const admin = userMap.get(Number(a.assigned_by)) || {};

      return {
        id: a.id,
        assignment_id: a.id,
        recruiter_id: a.recruiter_id,
        recruiter_name: recruiter.name || 'Unknown Recruiter',
        recruiter_email: recruiter.email || '',
        recruiter_emp_id: recruiter.employee_id || `EMP-${String(recruiter.id || '').padStart(4, '0')}`,
        college_id: a.college_id,
        college_code: college.lead_id || `COL-${String(college.id || '').padStart(6, '0')}`,
        college_name: college.company_name || 'Unnamed College',
        district: college.district || 'Tamil Nadu',
        location: college.taluk || college.district || 'Tamil Nadu',
        college_type: college.industry || 'Engineering / Arts College',
        contact_person: college.recruiter_name || 'Placement Officer',
        contact_number: college.mobile || '-',
        email: college.email || '-',
        assignment_status: a.assignment_status || 'ASSIGNED',
        assigned_date: a.assigned_at || a.created_at,
        assigned_by_id: a.assigned_by,
        assigned_by_name: admin.name || 'System Administrator',
        notes: a.notes || ''
      };
    });

    // Filter by Recruiter
    if (params.recruiter_id && params.recruiter_id !== 'ALL') {
      items = items.filter((i) => Number(i.recruiter_id) === Number(params.recruiter_id));
    }

    // Filter by District
    if (params.district && params.district !== 'ALL') {
      const d = params.district.toLowerCase();
      items = items.filter((i) => (i.district || '').toLowerCase().includes(d));
    }

    // Filter by College Type
    if (params.college_type && params.college_type !== 'ALL') {
      const t = params.college_type.toLowerCase();
      items = items.filter((i) => (i.college_type || '').toLowerCase().includes(t));
    }

    // Search query
    if (params.search && params.search.trim()) {
      const term = params.search.trim().toLowerCase();
      items = items.filter((i) =>
        (i.college_name && i.college_name.toLowerCase().includes(term)) ||
        (i.college_code && i.college_code.toLowerCase().includes(term)) ||
        (i.district && i.district.toLowerCase().includes(term)) ||
        (i.contact_person && i.contact_person.toLowerCase().includes(term)) ||
        (i.recruiter_name && i.recruiter_name.toLowerCase().includes(term))
      );
    }

    // Sort descending by assignment date
    items.sort((a, b) => new Date(b.assigned_date || 0) - new Date(a.assigned_date || 0));

    const total = items.length;
    const page = Number(params.page) || 1;
    const pageSize = Number(params.page_size) || 10;
    const offset = (page - 1) * pageSize;
    const pagedItems = items.slice(offset, offset + pageSize);
    const total_pages = Math.ceil(total / pageSize) || 1;

    return {
      items: pagedItems,
      total,
      page,
      page_size: pageSize,
      total_pages
    };
  },

  /**
   * Get available colleges for assignment
   */
  getAvailableColleges: async (params = {}) => {
    const [leads, assignments, users] = await Promise.all([
      dbOps.getAll('recruiters'),
      dbOps.getAll('recruiter_college_assignments'),
      dbOps.getAll('users')
    ]);

    const userMap = new Map();
    users.forEach((u) => userMap.set(Number(u.id), u.name));

    const assignmentMap = new Map();
    assignments.forEach((a) => assignmentMap.set(Number(a.college_id), a));

    // Filter leads that are colleges
    let colleges = leads.filter((l) => {
      const ind = (l.industry || '').toLowerCase();
      return ind.includes('college') || ind.includes('engineering') || ind.includes('arts') || ind.includes('polytechnic');
    });

    let mapped = colleges.map((c) => {
      const assign = assignmentMap.get(Number(c.id));
      const assignedUser = assign ? userMap.get(Number(assign.recruiter_id)) : (c.assigned_to ? userMap.get(Number(c.assigned_to)) : null);

      return {
        id: c.id,
        college_code: c.lead_id || `REC-${String(c.id).padStart(6, '0')}`,
        college_name: c.company_name || 'College',
        district: c.district || 'Tamil Nadu',
        location: c.taluk || c.district || 'Tamil Nadu',
        college_type: c.industry || 'College',
        contact_person: c.recruiter_name || 'Placement Officer',
        contact_number: c.mobile || '-',
        email: c.email || '-',
        assigned_to: assign ? assign.recruiter_id : (c.assigned_to || null),
        assigned_recruiter_name: assignedUser || 'Unassigned',
        is_assigned: !!(assign || c.assigned_to)
      };
    });

    // Unassigned only filter
    if (params.unassigned_only) {
      mapped = mapped.filter((c) => !c.is_assigned);
    }

    // Search query
    if (params.search && params.search.trim()) {
      const term = params.search.trim().toLowerCase();
      mapped = mapped.filter((c) =>
        (c.college_name && c.college_name.toLowerCase().includes(term)) ||
        (c.college_code && c.college_code.toLowerCase().includes(term)) ||
        (c.district && c.district.toLowerCase().includes(term)) ||
        (c.contact_person && c.contact_person.toLowerCase().includes(term))
      );
    }

    if (params.district && params.district !== 'ALL') {
      mapped = mapped.filter((c) => (c.district || '').toLowerCase() === params.district.toLowerCase());
    }

    const total = mapped.length;
    const page = Number(params.page) || 1;
    const pageSize = Number(params.page_size) || 10;
    const offset = (page - 1) * pageSize;
    const pagedItems = mapped.slice(offset, offset + pageSize);
    const total_pages = Math.ceil(total / pageSize) || 1;

    return {
      items: pagedItems,
      total,
      page,
      page_size: pageSize,
      total_pages
    };
  },

  /**
   * Assign one or multiple colleges to a recruiter
   */
  assignColleges: async ({ recruiter_id, college_ids = [], notes = '' }) => {
    if (!recruiter_id) throw new Error('Please select a recruiter.');
    if (!college_ids || college_ids.length === 0) throw new Error('Please select at least one college to assign.');

    const currentUser = authService.getSessionUser();
    const adminId = currentUser?.id || null;
    const recId = Number(recruiter_id);

    const users = await dbOps.getAll('users');
    const targetRecruiter = users.find((u) => Number(u.id) === recId);
    if ((targetRecruiter?.role || '').toUpperCase() === 'ADMIN') {
      throw new Error('Administrators cannot be assigned colleges. Please select a recruiter.');
    }
    const recruiterName = targetRecruiter?.name || 'Recruiter';

    const leads = await dbOps.getAll('recruiters');
    const leadMap = new Map();
    leads.forEach((l) => leadMap.set(Number(l.id), l));

    for (const collegeId of college_ids) {
      const cId = Number(collegeId);
      const college = leadMap.get(cId);
      const collegeName = college?.company_name || 'College';
      const collegeCode = college?.lead_id || `REC-${String(cId).padStart(6, '0')}`;

      // Insert or update in recruiter_college_assignments
      await sql.query(`
        INSERT INTO recruiter_college_assignments (
          recruiter_id, college_id, assigned_by, assigned_at, assignment_status, notes, updated_at
        ) VALUES (
          ${recId}, ${cId}, ${adminId ? adminId : 'NULL'}, CURRENT_TIMESTAMP, 'ASSIGNED', 
          ${formatSqlValue(notes)}, CURRENT_TIMESTAMP
        ) ON CONFLICT (recruiter_id, college_id) DO UPDATE SET
          assignment_status = 'ASSIGNED',
          assigned_by = ${adminId ? adminId : 'NULL'},
          assigned_at = CURRENT_TIMESTAMP,
          notes = ${formatSqlValue(notes)},
          updated_at = CURRENT_TIMESTAMP
      `);

      // Keep master lead assigned_to synchronized
      await sql.query(`UPDATE recruiter_leads SET assigned_to = ${recId} WHERE id = ${cId}`);

      // Log recruiter activity
      await recruiterActivityService.logActivity({
        recruiter_id: recId,
        recruiter_name: recruiterName,
        action_type: 'College assigned',
        candidate_id: null,
        candidate_name: null,
        job_id: collegeCode,
        job_name: collegeName,
        previous_status: 'UNASSIGNED',
        new_status: 'ASSIGNED',
        description: `College '${collegeName}' (${collegeCode}) assigned to ${recruiterName} by Administrator.${notes ? ' Note: ' + notes : ''}`
      });
    }

    // Invalidate caches
    await Promise.all([
      dbOps.getAll('recruiter_college_assignments', { forceFresh: true }),
      dbOps.getAll('recruiters', { forceFresh: true })
    ]);

    return { success: true, count: college_ids.length };
  },

  /**
   * Reassign college to another recruiter
   */
  reassignCollege: async ({ college_id, new_recruiter_id, notes = '' }) => {
    if (!college_id || !new_recruiter_id) throw new Error('Missing college ID or target recruiter.');

    const cId = Number(college_id);
    const newRecId = Number(new_recruiter_id);
    const currentUser = authService.getSessionUser();
    const adminId = currentUser?.id || null;

    const [users, leads] = await Promise.all([
      dbOps.getAll('users'),
      dbOps.getAll('recruiters')
    ]);

    const newRecruiter = users.find((u) => Number(u.id) === newRecId);
    if ((newRecruiter?.role || '').toUpperCase() === 'ADMIN') {
      throw new Error('Administrators cannot be assigned colleges. Please select a recruiter.');
    }
    const newRecruiterName = newRecruiter?.name || 'Recruiter';
    const college = leads.find((l) => Number(l.id) === cId);
    const collegeName = college?.company_name || 'College';
    const collegeCode = college?.lead_id || `REC-${String(cId).padStart(6, '0')}`;

    // Remove any previous active assignment for this college
    await sql.query(`DELETE FROM recruiter_college_assignments WHERE college_id = ${cId}`);

    // Insert new assignment
    await sql.query(`
      INSERT INTO recruiter_college_assignments (
        recruiter_id, college_id, assigned_by, assigned_at, assignment_status, notes, updated_at
      ) VALUES (
        ${newRecId}, ${cId}, ${adminId ? adminId : 'NULL'}, CURRENT_TIMESTAMP, 'ASSIGNED', 
        ${formatSqlValue(notes)}, CURRENT_TIMESTAMP
      )
    `);

    // Update master lead
    await sql.query(`UPDATE recruiter_leads SET assigned_to = ${newRecId} WHERE id = ${cId}`);

    // Log Activity
    await recruiterActivityService.logActivity({
      recruiter_id: newRecId,
      recruiter_name: newRecruiterName,
      action_type: 'College assigned',
      candidate_id: null,
      candidate_name: null,
      job_id: collegeCode,
      job_name: collegeName,
      previous_status: 'REASSIGNED',
      new_status: 'ASSIGNED',
      description: `College '${collegeName}' reallocated to ${newRecruiterName} by Administrator.${notes ? ' Reason: ' + notes : ''}`
    });

    await Promise.all([
      dbOps.getAll('recruiter_college_assignments', { forceFresh: true }),
      dbOps.getAll('recruiters', { forceFresh: true })
    ]);

    return { success: true };
  },

  /**
   * Remove / unassign college from recruiter
   */
  unassignCollege: async (assignmentId, collegeId) => {
    const cId = Number(collegeId);
    const aId = Number(assignmentId);

    const leads = await dbOps.getAll('recruiters');
    const college = leads.find((l) => Number(l.id) === cId);
    const collegeName = college?.company_name || 'College';

    if (aId) {
      await sql.query(`DELETE FROM recruiter_college_assignments WHERE id = ${aId}`);
    } else if (cId) {
      await sql.query(`DELETE FROM recruiter_college_assignments WHERE college_id = ${cId}`);
    }

    if (cId) {
      await sql.query(`UPDATE recruiter_leads SET assigned_to = NULL WHERE id = ${cId}`);
    }

    await Promise.all([
      dbOps.getAll('recruiter_college_assignments', { forceFresh: true }),
      dbOps.getAll('recruiters', { forceFresh: true })
    ]);

    return { success: true, message: `College '${collegeName}' unassigned.` };
  },

  // ==========================================
  // 2. VENDOR ASSIGNMENTS
  // ==========================================

  /**
   * Get all vendor assignments with filtering and recruiter details
   */
  getVendorAssignments: async (params = {}) => {
    const [assignments, leads, users] = await Promise.all([
      dbOps.getAll('recruiter_vendor_assignments', { forceFresh: true }),
      dbOps.getAll('recruiters'),
      dbOps.getAll('users')
    ]);

    const leadMap = new Map();
    leads.forEach((l) => leadMap.set(Number(l.id), l));

    const userMap = new Map();
    users.forEach((u) => userMap.set(Number(u.id), u));

    let items = assignments.map((a) => {
      const vendor = leadMap.get(Number(a.vendor_id)) || {};
      const recruiter = userMap.get(Number(a.recruiter_id)) || {};
      const admin = userMap.get(Number(a.assigned_by)) || {};

      return {
        id: a.id,
        assignment_id: a.id,
        recruiter_id: a.recruiter_id,
        recruiter_name: recruiter.name || 'Unknown Recruiter',
        recruiter_email: recruiter.email || '',
        recruiter_emp_id: recruiter.employee_id || `EMP-${String(recruiter.id || '').padStart(4, '0')}`,
        vendor_id: a.vendor_id,
        vendor_code: vendor.lead_id || `VEN-${String(vendor.id || '').padStart(6, '0')}`,
        vendor_name: vendor.company_name || 'Vendor Partner',
        company_name: vendor.company_name || 'Vendor Partner',
        location: vendor.district || vendor.taluk || 'Tamil Nadu',
        vendor_type: vendor.industry || 'Vendors',
        contact_person: vendor.recruiter_name || 'Business SPOC',
        phone_number: vendor.mobile || '-',
        email: vendor.email || '-',
        assignment_status: a.assignment_status || 'ASSIGNED',
        assigned_date: a.assigned_at || a.created_at,
        assigned_by_id: a.assigned_by,
        assigned_by_name: admin.name || 'System Administrator',
        notes: a.notes || ''
      };
    });

    // Filter by Recruiter
    if (params.recruiter_id && params.recruiter_id !== 'ALL') {
      items = items.filter((i) => Number(i.recruiter_id) === Number(params.recruiter_id));
    }

    // Search query
    if (params.search && params.search.trim()) {
      const term = params.search.trim().toLowerCase();
      items = items.filter((i) =>
        (i.vendor_name && i.vendor_name.toLowerCase().includes(term)) ||
        (i.vendor_code && i.vendor_code.toLowerCase().includes(term)) ||
        (i.contact_person && i.contact_person.toLowerCase().includes(term)) ||
        (i.recruiter_name && i.recruiter_name.toLowerCase().includes(term)) ||
        (i.location && i.location.toLowerCase().includes(term))
      );
    }

    items.sort((a, b) => new Date(b.assigned_date || 0) - new Date(a.assigned_date || 0));

    const total = items.length;
    const page = Number(params.page) || 1;
    const pageSize = Number(params.page_size) || 10;
    const offset = (page - 1) * pageSize;
    const pagedItems = items.slice(offset, offset + pageSize);
    const total_pages = Math.ceil(total / pageSize) || 1;

    return {
      items: pagedItems,
      total,
      page,
      page_size: pageSize,
      total_pages
    };
  },

  /**
   * Get available vendors for assignment
   */
  getAvailableVendors: async (params = {}) => {
    const [leads, assignments, users] = await Promise.all([
      dbOps.getAll('recruiters'),
      dbOps.getAll('recruiter_vendor_assignments'),
      dbOps.getAll('users')
    ]);

    const userMap = new Map();
    users.forEach((u) => userMap.set(Number(u.id), u.name));

    const assignmentMap = new Map();
    assignments.forEach((a) => assignmentMap.set(Number(a.vendor_id), a));

    // Leads that are vendors
    let vendors = leads.filter((l) => {
      const ind = (l.industry || '').toLowerCase();
      return ind.includes('vendor') || ind.includes('agency') || ind.includes('consultancy');
    });

    let mapped = vendors.map((v) => {
      const assign = assignmentMap.get(Number(v.id));
      const assignedUser = assign ? userMap.get(Number(assign.recruiter_id)) : (v.assigned_to ? userMap.get(Number(v.assigned_to)) : null);

      return {
        id: v.id,
        vendor_code: v.lead_id || `VEN-${String(v.id).padStart(6, '0')}`,
        vendor_name: v.company_name || 'Vendor',
        company_name: v.company_name || 'Vendor',
        location: v.district || 'Tamil Nadu',
        vendor_type: v.industry || 'Vendors',
        contact_person: v.recruiter_name || 'SPOC',
        phone_number: v.mobile || '-',
        email: v.email || '-',
        assigned_to: assign ? assign.recruiter_id : (v.assigned_to || null),
        assigned_recruiter_name: assignedUser || 'Unassigned',
        is_assigned: !!(assign || v.assigned_to)
      };
    });

    if (params.unassigned_only) {
      mapped = mapped.filter((v) => !v.is_assigned);
    }

    if (params.search && params.search.trim()) {
      const term = params.search.trim().toLowerCase();
      mapped = mapped.filter((v) =>
        (v.vendor_name && v.vendor_name.toLowerCase().includes(term)) ||
        (v.vendor_code && v.vendor_code.toLowerCase().includes(term)) ||
        (v.contact_person && v.contact_person.toLowerCase().includes(term))
      );
    }

    const total = mapped.length;
    const page = Number(params.page) || 1;
    const pageSize = Number(params.page_size) || 10;
    const offset = (page - 1) * pageSize;
    const pagedItems = mapped.slice(offset, offset + pageSize);
    const total_pages = Math.ceil(total / pageSize) || 1;

    return {
      items: pagedItems,
      total,
      page,
      page_size: pageSize,
      total_pages
    };
  },

  /**
   * Assign vendors to recruiter
   */
  assignVendors: async ({ recruiter_id, vendor_ids = [], notes = '' }) => {
    if (!recruiter_id) throw new Error('Please select a recruiter.');
    if (!vendor_ids || vendor_ids.length === 0) throw new Error('Please select at least one vendor to assign.');

    const currentUser = authService.getSessionUser();
    const adminId = currentUser?.id || null;
    const recId = Number(recruiter_id);

    const users = await dbOps.getAll('users');
    const targetRecruiter = users.find((u) => Number(u.id) === recId);
    if ((targetRecruiter?.role || '').toUpperCase() === 'ADMIN') {
      throw new Error('Administrators cannot be assigned vendors. Please select a recruiter.');
    }
    const recruiterName = targetRecruiter?.name || 'Recruiter';

    const leads = await dbOps.getAll('recruiters');
    const leadMap = new Map();
    leads.forEach((l) => leadMap.set(Number(l.id), l));

    for (const vendorId of vendor_ids) {
      const vId = Number(vendorId);
      const vendor = leadMap.get(vId);
      const vendorName = vendor?.company_name || 'Vendor Partner';
      const vendorCode = vendor?.lead_id || `VEN-${String(vId).padStart(6, '0')}`;

      await sql.query(`
        INSERT INTO recruiter_vendor_assignments (
          recruiter_id, vendor_id, assigned_by, assigned_at, assignment_status, notes, updated_at
        ) VALUES (
          ${recId}, ${vId}, ${adminId ? adminId : 'NULL'}, CURRENT_TIMESTAMP, 'ASSIGNED', 
          ${formatSqlValue(notes)}, CURRENT_TIMESTAMP
        ) ON CONFLICT (recruiter_id, vendor_id) DO UPDATE SET
          assignment_status = 'ASSIGNED',
          assigned_by = ${adminId ? adminId : 'NULL'},
          assigned_at = CURRENT_TIMESTAMP,
          notes = ${formatSqlValue(notes)},
          updated_at = CURRENT_TIMESTAMP
      `);

      await sql.query(`UPDATE recruiter_leads SET assigned_to = ${recId} WHERE id = ${vId}`);

      await recruiterActivityService.logActivity({
        recruiter_id: recId,
        recruiter_name: recruiterName,
        action_type: 'Vendor assigned',
        candidate_id: null,
        candidate_name: null,
        job_id: vendorCode,
        job_name: vendorName,
        previous_status: 'UNASSIGNED',
        new_status: 'ASSIGNED',
        description: `Vendor '${vendorName}' (${vendorCode}) assigned to ${recruiterName} by Administrator.${notes ? ' Note: ' + notes : ''}`
      });
    }

    await Promise.all([
      dbOps.getAll('recruiter_vendor_assignments', { forceFresh: true }),
      dbOps.getAll('recruiters', { forceFresh: true })
    ]);

    return { success: true, count: vendor_ids.length };
  },

  /**
   * Reassign vendor to another recruiter
   */
  reassignVendor: async ({ vendor_id, new_recruiter_id, notes = '' }) => {
    if (!vendor_id || !new_recruiter_id) throw new Error('Missing vendor ID or target recruiter.');

    const vId = Number(vendor_id);
    const newRecId = Number(new_recruiter_id);
    const currentUser = authService.getSessionUser();
    const adminId = currentUser?.id || null;

    const [users, leads] = await Promise.all([
      dbOps.getAll('users'),
      dbOps.getAll('recruiters')
    ]);

    const newRecruiter = users.find((u) => Number(u.id) === newRecId);
    if ((newRecruiter?.role || '').toUpperCase() === 'ADMIN') {
      throw new Error('Administrators cannot be assigned vendors. Please select a recruiter.');
    }
    const newRecruiterName = newRecruiter?.name || 'Recruiter';
    const vendor = leads.find((l) => Number(l.id) === vId);
    const vendorName = vendor?.company_name || 'Vendor';
    const vendorCode = vendor?.lead_id || `VEN-${String(vId).padStart(6, '0')}`;

    await sql.query(`DELETE FROM recruiter_vendor_assignments WHERE vendor_id = ${vId}`);

    await sql.query(`
      INSERT INTO recruiter_vendor_assignments (
        recruiter_id, vendor_id, assigned_by, assigned_at, assignment_status, notes, updated_at
      ) VALUES (
        ${newRecId}, ${vId}, ${adminId ? adminId : 'NULL'}, CURRENT_TIMESTAMP, 'ASSIGNED', 
        ${formatSqlValue(notes)}, CURRENT_TIMESTAMP
      )
    `);

    await sql.query(`UPDATE recruiter_leads SET assigned_to = ${newRecId} WHERE id = ${vId}`);

    await recruiterActivityService.logActivity({
      recruiter_id: newRecId,
      recruiter_name: newRecruiterName,
      action_type: 'Vendor assigned',
      candidate_id: null,
      candidate_name: null,
      job_id: vendorCode,
      job_name: vendorName,
      previous_status: 'REASSIGNED',
      new_status: 'ASSIGNED',
      description: `Vendor '${vendorName}' reallocated to ${newRecruiterName} by Administrator.${notes ? ' Reason: ' + notes : ''}`
    });

    await Promise.all([
      dbOps.getAll('recruiter_vendor_assignments', { forceFresh: true }),
      dbOps.getAll('recruiters', { forceFresh: true })
    ]);

    return { success: true };
  },

  /**
   * Remove / unassign vendor from recruiter
   */
  unassignVendor: async (assignmentId, vendorId) => {
    const vId = Number(vendorId);
    const aId = Number(assignmentId);

    const leads = await dbOps.getAll('recruiters');
    const vendor = leads.find((l) => Number(l.id) === vId);
    const vendorName = vendor?.company_name || 'Vendor';

    if (aId) {
      await sql.query(`DELETE FROM recruiter_vendor_assignments WHERE id = ${aId}`);
    } else if (vId) {
      await sql.query(`DELETE FROM recruiter_vendor_assignments WHERE vendor_id = ${vId}`);
    }

    if (vId) {
      await sql.query(`UPDATE recruiter_leads SET assigned_to = NULL WHERE id = ${vId}`);
    }

    await Promise.all([
      dbOps.getAll('recruiter_vendor_assignments', { forceFresh: true }),
      dbOps.getAll('recruiters', { forceFresh: true })
    ]);

    return { success: true, message: `Vendor '${vendorName}' unassigned.` };
  },

  // ==========================================
  // 3. CANDIDATE ASSIGNMENTS
  // ==========================================

  /**
   * Get all candidate assignments with filtering and recruiter details
   */
  getCandidateAssignments: async (params = {}) => {
    const [candidates, users] = await Promise.all([
      dbOps.getAll('candidates', { forceFresh: true }),
      dbOps.getAll('users')
    ]);

    const userMap = new Map();
    users.forEach((u) => userMap.set(Number(u.id), u));

    // Only candidates with assigned_to or filter
    let items = candidates
      .filter((c) => c.assigned_to)
      .map((c) => {
        const recruiter = userMap.get(Number(c.assigned_to)) || {};
        return {
          id: c.id,
          candidate_id: c.candidate_id || `CAN-${String(c.id).padStart(6, '0')}`,
          name: c.name || 'Unnamed Candidate',
          contact_number: c.contact_number || '-',
          email: c.email || '-',
          location: c.location || 'Tamil Nadu',
          state: c.state || 'Tamil Nadu',
          educational_qualification: c.educational_qualification || '-',
          specialization: c.specialization || '-',
          college_name: c.college_name || '-',
          experience_type: c.experience_type || 'Fresher',
          status: c.status || 'NEW',
          recruiter_id: c.assigned_to,
          recruiter_name: recruiter.name || 'Assigned Recruiter',
          recruiter_email: recruiter.email || '',
          recruiter_emp_id: recruiter.employee_id || `EMP-${String(recruiter.id || '').padStart(4, '0')}`,
          assigned_date: c.updated_at || c.created_at,
          assigned_by_name: 'Administrator'
        };
      });

    if (params.recruiter_id && params.recruiter_id !== 'ALL') {
      items = items.filter((i) => Number(i.recruiter_id) === Number(params.recruiter_id));
    }

    if (params.status && params.status !== 'ALL') {
      items = items.filter((i) => (i.status || '').toUpperCase() === params.status.toUpperCase());
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((i) =>
        (i.name && i.name.toLowerCase().includes(q)) ||
        (i.candidate_id && i.candidate_id.toLowerCase().includes(q)) ||
        (i.contact_number && i.contact_number.toLowerCase().includes(q)) ||
        (i.location && i.location.toLowerCase().includes(q)) ||
        (i.educational_qualification && i.educational_qualification.toLowerCase().includes(q))
      );
    }

    const total = items.length;
    const page = Number(params.page) || 1;
    const pageSize = Number(params.page_size) || 10;
    const total_pages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const paginatedItems = items.slice(start, start + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      page_size: pageSize,
      total_pages
    };
  },

  /**
   * Get available candidates for assignment
   */
  getAvailableCandidates: async (params = {}) => {
    const [candidates, users] = await Promise.all([
      dbOps.getAll('candidates', { forceFresh: true }),
      dbOps.getAll('users')
    ]);

    const userMap = new Map();
    users.forEach((u) => userMap.set(Number(u.id), u));

    let items = candidates.map((c) => {
      const recruiter = c.assigned_to ? userMap.get(Number(c.assigned_to)) : null;
      return {
        id: c.id,
        candidate_id: c.candidate_id || `CAN-${String(c.id).padStart(6, '0')}`,
        name: c.name || 'Unnamed Candidate',
        contact_number: c.contact_number || '-',
        email: c.email || '-',
        location: c.location || 'Tamil Nadu',
        educational_qualification: c.educational_qualification || '-',
        experience_type: c.experience_type || 'Fresher',
        status: c.status || 'NEW',
        assigned_to: c.assigned_to || null,
        assigned_recruiter_name: recruiter ? recruiter.name : null
      };
    });

    if (params.unassignedOnly || params.unassigned_only) {
      items = items.filter((c) => !c.assigned_to);
    }

    if (params.status && params.status !== 'ALL') {
      items = items.filter((c) => (c.status || '').toUpperCase() === params.status.toUpperCase());
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.candidate_id && c.candidate_id.toLowerCase().includes(q)) ||
        (c.contact_number && c.contact_number.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q)) ||
        (c.educational_qualification && c.educational_qualification.toLowerCase().includes(q))
      );
    }

    const total = items.length;
    const page = Number(params.page) || 1;
    const pageSize = Number(params.page_size) || 10;
    const total_pages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const paginatedItems = items.slice(start, start + pageSize);

    return {
      items: paginatedItems,
      total,
      page,
      page_size: pageSize,
      total_pages
    };
  },

  /**
   * Bulk assign candidates to recruiter
   */
  assignCandidates: async (recruiterId, candidateIds = [], notes = '') => {
    if (!recruiterId || candidateIds.length === 0) {
      throw new Error('Please choose a recruiter and at least one candidate.');
    }

    const recId = Number(recruiterId);
    const users = await dbOps.getAll('users');
    const recruiter = users.find((u) => Number(u.id) === recId);
    if ((recruiter?.role || '').toUpperCase() === 'ADMIN') {
      throw new Error('Administrators cannot be assigned candidates. Please select a recruiter.');
    }
    const recruiterName = recruiter?.name || 'Recruiter';

    const idsStr = candidateIds.map((id) => Number(id)).join(', ');
    await sql.query(`UPDATE candidates SET assigned_to = ${recId}, updated_at = NOW() WHERE id IN (${idsStr})`);

    const candidates = await dbOps.getAll('candidates');
    for (const id of candidateIds) {
      const cand = candidates.find((c) => Number(c.id) === Number(id));
      await recruiterActivityService.logActivity({
        recruiter_id: recId,
        recruiter_name: recruiterName,
        action_type: 'Candidate assigned',
        candidate_id: cand?.candidate_id || `CAN-${String(id).padStart(6, '0')}`,
        candidate_name: cand?.name || 'Candidate',
        job_id: null,
        job_name: 'Assigned Candidate Pool',
        previous_status: cand?.status || 'NEW',
        new_status: 'ASSIGNED',
        description: `Candidate '${cand?.name || id}' assigned to ${recruiterName} by Administrator.${notes ? ' Notes: ' + notes : ''}`
      });
    }

    await dbOps.getAll('candidates', { forceFresh: true });

    return {
      success: true,
      count: candidateIds.length,
      message: `Successfully assigned ${candidateIds.length} candidate(s) to ${recruiterName}.`
    };
  },

  /**
   * Reassign a candidate
   */
  reassignCandidate: async (candidateId, newRecruiterId, notes = '') => {
    const candId = Number(candidateId);
    const newRecId = Number(newRecruiterId);

    const users = await dbOps.getAll('users');
    const newRecruiter = users.find((u) => Number(u.id) === newRecId);
    if ((newRecruiter?.role || '').toUpperCase() === 'ADMIN') {
      throw new Error('Administrators cannot be assigned candidates. Please select a recruiter.');
    }
    const newRecruiterName = newRecruiter?.name || 'Recruiter';

    const candidates = await dbOps.getAll('candidates');
    const cand = candidates.find((c) => Number(c.id) === candId);
    const candName = cand?.name || 'Candidate';

    await sql.query(`UPDATE candidates SET assigned_to = ${newRecId}, updated_at = NOW() WHERE id = ${candId}`);

    await recruiterActivityService.logActivity({
      recruiter_id: newRecId,
      recruiter_name: newRecruiterName,
      action_type: 'Candidate assigned',
      candidate_id: cand?.candidate_id || `CAN-${String(candId).padStart(6, '0')}`,
      candidate_name: candName,
      job_id: null,
      job_name: 'Assigned Candidate Pool',
      previous_status: 'REASSIGNED',
      new_status: 'ASSIGNED',
      description: `Candidate '${candName}' reallocated to ${newRecruiterName} by Administrator.${notes ? ' Reason: ' + notes : ''}`
    });

    await dbOps.getAll('candidates', { forceFresh: true });

    return { success: true };
  },

  /**
   * Unassign candidate
   */
  unassignCandidate: async (candidateId) => {
    const cId = Number(candidateId);
    const candidates = await dbOps.getAll('candidates');
    const cand = candidates.find((c) => Number(c.id) === cId);
    const candName = cand?.name || 'Candidate';

    await sql.query(`UPDATE candidates SET assigned_to = NULL, updated_at = NOW() WHERE id = ${cId}`);
    await dbOps.getAll('candidates', { forceFresh: true });

    return { success: true, message: `Candidate '${candName}' unassigned.` };
  }
};
