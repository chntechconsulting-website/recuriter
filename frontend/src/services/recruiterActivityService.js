import { dbOps, sql, formatSqlValue } from '../db/database';
import { authService } from './authService';

export const recruiterActivityService = {
  /**
   * Log any recruiter action to the database table `recruiter_activities`
   */
  logActivity: async (data) => {
    try {
      const currentUser = authService.getSessionUser();
      const recruiterId = data.recruiter_id || currentUser?.id || 1;
      const recruiterName = data.recruiter_name || currentUser?.name || 'Recruiter';

      const payload = {
        recruiter_id: Number(recruiterId),
        recruiter_name: recruiterName,
        action_type: data.action_type || 'Candidate updated',
        candidate_id: data.candidate_id ? String(data.candidate_id) : null,
        candidate_name: data.candidate_name ? String(data.candidate_name) : null,
        job_id: data.job_id ? String(data.job_id) : null,
        job_name: data.job_name ? String(data.job_name) : null,
        previous_status: data.previous_status ? String(data.previous_status) : null,
        new_status: data.new_status ? String(data.new_status) : null,
        description: data.description || `${data.action_type || 'Action'} performed on ${data.candidate_name || 'candidate'}`,
        created_at: data.created_at || new Date().toISOString()
      };

      const inserted = await dbOps.insert('recruiter_activities', payload);
      return inserted;
    } catch (err) {
      console.warn('Failed to log recruiter activity:', err);
      return null;
    }
  },

  /**
   * Get all recruiters with calculated KPI metrics and latest activity
   */
  getAllRecruitersWithKpis: async (params = {}) => {
    // 1. Fetch users, candidates, activities, leads, and assignment tables
    const [users, candidates, activities, leads, collegeAssignments, vendorAssignments] = await Promise.all([
      dbOps.getAll('users'),
      dbOps.getAll('candidates'),
      dbOps.getAll('recruiter_activities'),
      dbOps.getAll('recruiters'),
      dbOps.getAll('recruiter_college_assignments'),
      dbOps.getAll('recruiter_vendor_assignments')
    ]);

    // Filter to recruiters/staff (or all non-system users)
    let recruiters = users.filter((u) => {
      const role = (u.role || '').toUpperCase();
      return role === 'STAFF' || role === 'RECRUITER' || (params.includeAdmins && role === 'ADMIN');
    });

    // If search filter is present
    if (params.search && params.search.trim()) {
      const term = params.search.trim().toLowerCase();
      recruiters = recruiters.filter((u) =>
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.employee_id && u.employee_id.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (params.status && params.status !== 'ALL') {
      recruiters = recruiters.filter((u) => (u.status || '').toUpperCase() === params.status.toUpperCase());
    }

    // Compute KPIs for each recruiter
    const result = recruiters.map((recruiter) => {
      const recId = Number(recruiter.id);

      // Candidates assigned to this recruiter
      const assignedCandidates = candidates.filter((c) => Number(c.assigned_to) === recId);

      // Count by candidate status
      let contactedCount = 0;
      let shortlistedCount = 0;
      let interviewScheduledCount = 0;
      let selectedCount = 0;
      let rejectedCount = 0;
      let joinedCount = 0;

      assignedCandidates.forEach((c) => {
        const s = (c.status || '').toUpperCase();
        if (s === 'CONTACTED') contactedCount++;
        else if (s === 'SHORTLISTED' || s === 'SCREENED') shortlistedCount++;
        else if (s === 'INTERVIEW_SCHEDULED') interviewScheduledCount++;
        else if (s === 'SELECTED') selectedCount++;
        else if (s === 'REJECTED') rejectedCount++;
        else if (s === 'JOINED' || s === 'PLACED') joinedCount++;
      });

      // Assigned colleges & institutional partners count (from assignment table or leads)
      const collegeSet = new Set([
        ...collegeAssignments.filter((a) => Number(a.recruiter_id) === recId).map((a) => a.college_id),
        ...leads.filter((l) => Number(l.assigned_to) === recId && !(l.industry || '').toLowerCase().includes('vendor')).map((l) => l.id)
      ]);

      // Assigned vendors count
      const vendorSet = new Set([
        ...vendorAssignments.filter((a) => Number(a.recruiter_id) === recId).map((a) => a.vendor_id),
        ...leads.filter((l) => Number(l.assigned_to) === recId && (l.industry || '').toLowerCase().includes('vendor')).map((l) => l.id)
      ]);

      // Recruiter's activities
      const userActivities = activities
        .filter((a) => Number(a.recruiter_id) === recId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const lastActivity = userActivities.length > 0 ? userActivities[0] : null;

      return {
        id: recruiter.id,
        name: recruiter.name,
        email: recruiter.email,
        employee_id: recruiter.employee_id || `EMP-${String(recruiter.id).padStart(4, '0')}`,
        phone: recruiter.phone || '',
        role: recruiter.role || 'STAFF',
        status: recruiter.status || 'ACTIVE',
        last_login: recruiter.last_login || null,
        created_at: recruiter.created_at,
        assigned_candidates_count: assignedCandidates.length,
        assigned_colleges_count: collegeSet.size,
        assigned_vendors_count: vendorSet.size,
        contacted_count: contactedCount,
        shortlisted_count: shortlistedCount,
        interview_scheduled_count: interviewScheduledCount,
        selected_count: selectedCount,
        rejected_count: rejectedCount,
        joined_count: joinedCount,
        total_activities_count: userActivities.length,
        last_activity: lastActivity
          ? {
              action_type: lastActivity.action_type,
              candidate_name: lastActivity.candidate_name,
              job_name: lastActivity.job_name,
              created_at: lastActivity.created_at,
              description: lastActivity.description
            }
          : null
      };
    });

    // Sort by assigned_candidates_count desc or last activity desc
    result.sort((a, b) => {
      const timeA = a.last_activity ? new Date(a.last_activity.created_at).getTime() : 0;
      const timeB = b.last_activity ? new Date(b.last_activity.created_at).getTime() : 0;
      return timeB - timeA;
    });

    return result;
  },

  /**
   * Get single recruiter profile, KPIs, assigned candidates, colleges, and vendors
   */
  getRecruiterDetails: async (recruiterId) => {
    const numId = Number(recruiterId);
    const [user, candidates, activities, leads, collegeAssignments, vendorAssignments] = await Promise.all([
      dbOps.getById('users', numId),
      dbOps.getAll('candidates'),
      dbOps.getAll('recruiter_activities'),
      dbOps.getAll('recruiters'),
      dbOps.getAll('recruiter_college_assignments'),
      dbOps.getAll('recruiter_vendor_assignments')
    ]);

    if (!user) {
      throw { response: { status: 404, data: { detail: 'Recruiter not found' } } };
    }

    const assignedCandidates = candidates.filter((c) => Number(c.assigned_to) === numId);
    
    // Assigned colleges and institutional partners (Colleges, NGOs, Training Centers, etc.)
    const collegeIdSet = new Set([
      ...collegeAssignments.filter((a) => Number(a.recruiter_id) === numId).map((a) => Number(a.college_id)),
      ...leads.filter((l) => Number(l.assigned_to) === numId && !(l.industry || '').toLowerCase().includes('vendor')).map((l) => Number(l.id))
    ]);
    const assignedColleges = leads.filter((l) => collegeIdSet.has(Number(l.id)));

    // Assigned vendors
    const vendorIdSet = new Set([
      ...vendorAssignments.filter((a) => Number(a.recruiter_id) === numId).map((a) => Number(a.vendor_id)),
      ...leads.filter((l) => Number(l.assigned_to) === numId && (l.industry || '').toLowerCase().includes('vendor')).map((l) => Number(l.id))
    ]);
    const assignedVendors = leads.filter((l) => vendorIdSet.has(Number(l.id)));

    const userActivities = activities
      .filter((a) => Number(a.recruiter_id) === numId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    let contacted = 0;
    let shortlisted = 0;
    let interviewScheduled = 0;
    let selected = 0;
    let rejected = 0;
    let joined = 0;

    assignedCandidates.forEach((c) => {
      const s = (c.status || '').toUpperCase();
      if (s === 'CONTACTED') contacted++;
      else if (s === 'SHORTLISTED' || s === 'SCREENED') shortlisted++;
      else if (s === 'INTERVIEW_SCHEDULED') interviewScheduled++;
      else if (s === 'SELECTED') selected++;
      else if (s === 'REJECTED') rejected++;
      else if (s === 'JOINED' || s === 'PLACED') joined++;
    });

    const conversionRate = assignedCandidates.length > 0 
      ? Math.round((joined / assignedCandidates.length) * 100) 
      : 0;

    const selectionRate = assignedCandidates.length > 0 
      ? Math.round(((selected + joined) / assignedCandidates.length) * 100) 
      : 0;

    // Separate activity counts by channel
    let candidateActivitiesCount = 0;
    let collegeActivitiesCount = 0;
    let vendorActivitiesCount = 0;

    userActivities.forEach((a) => {
      const t = (a.action_type || '').toLowerCase();
      if (t.includes('college')) {
        collegeActivitiesCount++;
      } else if (t.includes('vendor')) {
        vendorActivitiesCount++;
      } else {
        candidateActivitiesCount++;
      }
    });

    const collegesVendorsCount = assignedColleges.length + assignedVendors.length;
    const collegesVendorsActivitiesCount = collegeActivitiesCount + vendorActivitiesCount;

    return {
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        employee_id: user.employee_id || `EMP-${String(user.id).padStart(4, '0')}`,
        phone: user.phone || '',
        role: user.role || 'STAFF',
        status: user.status || 'ACTIVE',
        last_login: user.last_login || null,
        created_at: user.created_at
      },
      kpis: {
        total_assigned: assignedCandidates.length,
        contacted,
        shortlisted,
        interview_scheduled: interviewScheduled,
        selected,
        rejected,
        joined,
        conversion_rate: conversionRate,
        selection_rate: selectionRate,
        assigned_candidates_count: assignedCandidates.length,
        assigned_colleges_count: assignedColleges.length,
        assigned_vendors_count: assignedVendors.length,
        assigned_colleges_vendors_count: collegesVendorsCount,
        candidate_activities_count: candidateActivitiesCount,
        college_activities_count: collegeActivitiesCount,
        vendor_activities_count: vendorActivitiesCount,
        colleges_vendors_activities_count: collegesVendorsActivitiesCount,
        total_activities: userActivities.length
      },
      assigned_candidates: assignedCandidates.map((c) => ({
        id: c.id,
        candidate_id: c.candidate_id || `CAN-${String(c.id).padStart(6, '0')}`,
        name: c.name,
        contact_number: c.contact_number || '-',
        email: c.email || '-',
        location: c.location || 'Tamil Nadu',
        educational_qualification: c.educational_qualification || '-',
        experience_type: c.experience_type || 'Fresher',
        status: c.status || 'NEW',
        assigned_to: c.assigned_to,
        updated_at: c.updated_at || c.created_at
      })),
      assigned_colleges: assignedColleges.map((c) => ({
        id: c.id,
        college_code: c.lead_id || `REC-${String(c.id).padStart(6, '0')}`,
        college_name: c.company_name,
        district: c.district || 'Tamil Nadu',
        location: c.taluk || c.district || 'Tamil Nadu',
        college_type: c.industry || 'College',
        contact_person: c.recruiter_name || 'Placement SPOC',
        mobile: c.mobile || '-',
        email: c.email || '-',
        status: c.status || 'CONNECTED'
      })),
      assigned_vendors: assignedVendors.map((v) => ({
        id: v.id,
        vendor_code: v.lead_id || `VEN-${String(v.id).padStart(6, '0')}`,
        vendor_name: v.company_name,
        company_name: v.company_name,
        district: v.district || 'Tamil Nadu',
        location: v.taluk || v.district || 'Tamil Nadu',
        vendor_type: v.industry || 'Vendors',
        contact_person: v.recruiter_name || 'Business SPOC',
        mobile: v.mobile || '-',
        email: v.email || '-',
        status: v.status || 'CONNECTED'
      })),
      last_activity: userActivities[0] || null
    };
  },

  /**
   * Get activity history with rich multi-criteria filters
   */
  getRecruiterActivities: async (recruiterId, filters = {}) => {
    const numId = Number(recruiterId);
    const [allActivities, candidates] = await Promise.all([
      dbOps.getAll('recruiter_activities'),
      dbOps.getAll('candidates')
    ]);

    const candidateMap = new Map();
    candidates.forEach((c) => {
      if (c.candidate_id) candidateMap.set(c.candidate_id, c);
      candidateMap.set(String(c.id), c);
    });

    // Filter by recruiter
    let list = allActivities
      .filter((a) => Number(a.recruiter_id) === numId)
      .map((a) => {
        const cand = a.candidate_id ? candidateMap.get(a.candidate_id) : null;
        return {
          ...a,
          candidate_college: cand?.college_name || null,
          candidate_qualification: cand?.educational_qualification || null
        };
      });

    // 1. Date filter
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - (24 * 60 * 60 * 1000);
    const endOfYesterday = startOfToday - 1;
    const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = now.getTime() - (30 * 24 * 60 * 60 * 1000);

    const dateFilter = filters.dateRange || filters.date_range;
    if (dateFilter) {
      if (dateFilter === 'today') {
        list = list.filter((a) => new Date(a.created_at).getTime() >= startOfToday);
      } else if (dateFilter === 'yesterday') {
        list = list.filter((a) => {
          const t = new Date(a.created_at).getTime();
          return t >= startOfYesterday && t <= endOfYesterday;
        });
      } else if (dateFilter === 'last_7_days' || dateFilter === '7days') {
        list = list.filter((a) => new Date(a.created_at).getTime() >= sevenDaysAgo);
      } else if (dateFilter === 'last_30_days' || dateFilter === '30days') {
        list = list.filter((a) => new Date(a.created_at).getTime() >= thirtyDaysAgo);
      } else if (dateFilter === 'custom' && (filters.startDate || filters.endDate)) {
        if (filters.startDate) {
          const start = new Date(filters.startDate).setHours(0, 0, 0, 0);
          list = list.filter((a) => new Date(a.created_at).getTime() >= start);
        }
        if (filters.endDate) {
          const end = new Date(filters.endDate).setHours(23, 59, 59, 999);
          list = list.filter((a) => new Date(a.created_at).getTime() <= end);
        }
      }
    }

    // 2. Channel filter (candidate / college / vendor / colleges_vendors)
    if (filters.channel && filters.channel !== 'ALL') {
      const ch = filters.channel.toLowerCase();
      if (ch === 'colleges_vendors' || ch === 'colleges-vendors' || ch === 'college_vendor') {
        list = list.filter((a) => {
          const act = (a.action_type || '').toLowerCase();
          return act.includes('college') || act.includes('vendor');
        });
      } else if (ch === 'college') {
        list = list.filter((a) => (a.action_type || '').toLowerCase().includes('college'));
      } else if (ch === 'vendor') {
        list = list.filter((a) => (a.action_type || '').toLowerCase().includes('vendor'));
      } else if (ch === 'candidate') {
        list = list.filter((a) => {
          const act = (a.action_type || '').toLowerCase();
          return !act.includes('college') && !act.includes('vendor');
        });
      }
    }

    // 3. Action type filter
    if (filters.action_type && filters.action_type !== 'ALL') {
      const actTerm = filters.action_type.toLowerCase();
      list = list.filter((a) => (a.action_type || '').toLowerCase() === actTerm);
    }

    // 3. Job filter
    if (filters.job && filters.job !== 'ALL') {
      const jobTerm = filters.job.toLowerCase();
      list = list.filter((a) =>
        (a.job_id && a.job_id.toLowerCase() === jobTerm) ||
        (a.job_name && a.job_name.toLowerCase().includes(jobTerm))
      );
    }

    // 4. Candidate status filter
    if (filters.candidate_status && filters.candidate_status !== 'ALL') {
      const statTerm = filters.candidate_status.toLowerCase();
      list = list.filter((a) =>
        (a.new_status && a.new_status.toLowerCase() === statTerm) ||
        (a.previous_status && a.previous_status.toLowerCase() === statTerm)
      );
    }

    // 5. Search query by candidate name or job name
    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim().toLowerCase();
      list = list.filter((a) =>
        (a.candidate_name && a.candidate_name.toLowerCase().includes(term)) ||
        (a.candidate_id && a.candidate_id.toLowerCase().includes(term)) ||
        (a.job_name && a.job_name.toLowerCase().includes(term)) ||
        (a.description && a.description.toLowerCase().includes(term))
      );
    }

    // Sort descending by created_at
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = list.length;
    const page = Number(filters.page) || 1;
    const pageSize = Number(filters.page_size) || 20;
    const offset = (page - 1) * pageSize;
    const items = list.slice(offset, offset + pageSize);
    const total_pages = Math.ceil(total / pageSize) || 1;

    return {
      items,
      total,
      page,
      page_size: pageSize,
      total_pages
    };
  },

  /**
   * Get available jobs, action types, and statuses for filter dropdowns
   */
  getFilterOptions: async (recruiterId) => {
    const numId = Number(recruiterId);
    const [allActivities, leads] = await Promise.all([
      dbOps.getAll('recruiter_activities'),
      dbOps.getAll('recruiters')
    ]);

    const userActivities = allActivities.filter((a) => Number(a.recruiter_id) === numId);

    const actionTypes = Array.from(new Set(userActivities.map((a) => a.action_type).filter(Boolean)));
    const candidateStatuses = Array.from(
      new Set(userActivities.flatMap((a) => [a.previous_status, a.new_status]).filter(Boolean))
    );

    // Assigned institutions/partners appearing in activities, deduplicated by name
    const jobsMap = new Map();
    leads.filter((l) => Number(l.assigned_to) === numId).forEach((l) => {
      const name = l.company_name;
      const norm = name.trim().toLowerCase();
      if (!jobsMap.has(norm)) {
        jobsMap.set(norm, { id: l.lead_id || String(l.id), name });
      }
    });
    userActivities.forEach((a) => {
      if (a.job_name) {
        const norm = a.job_name.trim().toLowerCase();
        if (!jobsMap.has(norm)) {
          jobsMap.set(norm, { id: a.job_id || norm, name: a.job_name });
        }
      }
    });

    const jobs = Array.from(jobsMap.values());

    return {
      actionTypes,
      candidateStatuses,
      jobs
    };
  }
};
