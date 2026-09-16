import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { recruiterService } from '../services/recruiterService';
import { userService } from '../services/userService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { INSTITUTION_TYPES, LEAD_STATUSES, DISTRICTS, DISTRICT_METADATA, SOURCING_CHANNELS, CATEGORY_SUBCATEGORIES } from '../utils/constants';
import { GraduationCap, User as UserIcon, BookOpen, Info, ArrowLeft, Save, Sparkles } from 'lucide-react';

export const AddRecruiterLead = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('College');
  const [selectedSubCategory, setSelectedSubCategory] = useState('Arts and Science College');
  const [customSubCategory, setCustomSubCategory] = useState('');

  const [districtSelect, setDistrictSelect] = useState('Chennai');
  const [customDistrict, setCustomDistrict] = useState('');

  const [formData, setFormData] = useState({
    company_name: '',
    recruiter_name: '',
    designation: 'Placement Officer',
    mobile: '',
    alternate_mobile: '',
    email: '',
    website: '',
    address: '',
    district: 'Chennai',
    taluk: 'Chennai Zone',
    state: 'Tamil Nadu',
    industry: 'College',
    job_role: '',
    job_description: '',
    candidates_required: 0,
    salary_range: '',
    qualification: '',
    experience_required: '',
    job_location: 'Tamil Nadu',
    lead_source: 'Field Visit',
    sourced_by: user?.id || '',
    assigned_to: '',
    status: 'YET_TO_CONNECT',
    first_contact_date: new Date().toISOString().split('T')[0],
    next_follow_up_date: '',
    remarks: ''
  });

  const getDistrictOwnerId = (districtName, userList) => {
    if (!districtName || districtName === 'Other' || !userList || userList.length === 0) return null;
    const meta = DISTRICT_METADATA.find(d => d.district.toLowerCase() === districtName.toLowerCase());
    if (meta) {
      const matched = userList.find(u => u.name.toLowerCase().includes(meta.assignedTo.toLowerCase()));
      if (matched) return matched.id;
    }
    return null;
  };

  useEffect(() => {
    userService.getSimpleUsers().then((res) => {
      setUsers(res);
      const districtOwner = getDistrictOwnerId('Chennai', res);
      const isStaffUser = (user?.role || '').toUpperCase() === 'STAFF' || (user?.role || '').toUpperCase() === 'RECRUITER';
      const defaultAssigneeId = districtOwner || (isStaffUser ? user?.id : (res && res.length > 0 ? res[0].id : ''));
      setFormData((prev) => ({
        ...prev,
        sourced_by: prev.sourced_by || user?.id || (res && res.length > 0 ? res[0].id : ''),
        assigned_to: prev.assigned_to || defaultAssigneeId
      }));
    }).catch(() => {});
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setSelectedCategory(cat);
    const subList = CATEGORY_SUBCATEGORIES[cat] || [];
    const firstSub = subList[0] || cat;
    setSelectedSubCategory(firstSub);
    setCustomSubCategory('');
    setFormData((prev) => ({ ...prev, industry: firstSub }));
  };

  const handleSubCategoryChange = (e) => {
    const sub = e.target.value;
    setSelectedSubCategory(sub);
    if (!sub.startsWith('Other')) {
      setCustomSubCategory('');
      setFormData((prev) => ({ ...prev, industry: sub }));
    }
  };

  const handleDistrictSelectChange = (e) => {
    const val = e.target.value;
    setDistrictSelect(val);
    if (val !== 'Other') {
      const districtOwner = getDistrictOwnerId(val, users);
      setFormData((prev) => ({
        ...prev,
        district: val,
        assigned_to: districtOwner || prev.assigned_to
      }));
    } else {
      setFormData((prev) => ({ ...prev, district: customDistrict || 'Other' }));
    }
  };

  const handleCustomDistrictChange = (e) => {
    const val = e.target.value;
    setCustomDistrict(val);
    setFormData((prev) => ({ ...prev, district: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanMobile = formData.mobile.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|91|0)/, '');
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      error('Please enter a valid 10-digit mobile number (e.g. 9880123456)');
      return;
    }

    const finalDistrict = districtSelect === 'Other' ? (customDistrict.trim() || 'Other') : districtSelect;
    if (districtSelect === 'Other' && !customDistrict.trim()) {
      error('Please enter the custom district name');
      return;
    }

    const finalIndustry = selectedSubCategory.startsWith('Other') && customSubCategory.trim()
      ? customSubCategory.trim()
      : (selectedSubCategory || selectedCategory);

    setLoading(true);
    try {
      const payload = {
        ...formData,
        industry: finalIndustry,
        district: finalDistrict,
        mobile: cleanMobile,
        candidates_required: formData.candidates_required ? Number(formData.candidates_required) : 0,
        sourced_by: formData.sourced_by ? Number(formData.sourced_by) : null,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
        next_follow_up_date: formData.next_follow_up_date || null
      };

      const res = await recruiterService.createRecruiter(payload);
      success(`Contact registered! ID: ${res.lead_id}`);
      navigate(`/recruiters/${res.id}`);
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to register contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/recruiters"
            className="p-2 bg-white text-slate-500 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Add New College / Vendor Contact</h2>
            <p className="text-xs text-slate-500 mt-0.5">Register a college, skill training center, or vendor partner</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Institution / Vendor Basic Info */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">1. Institution / Vendor Information</h3>
              <p className="text-xs text-slate-400">Organization name, category, and primary SPOC</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Institution / College / Vendor Name *
              </label>
              <input
                type="text"
                required
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="e.g. RV College of Engineering / Pratham Training Center"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-bold text-blue-800"
              >
                {INSTITUTION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Sub-Category / Institution Type *
              </label>
              <select
                value={selectedSubCategory}
                onChange={handleSubCategoryChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-semibold text-slate-800"
              >
                {(CATEGORY_SUBCATEGORIES[selectedCategory] || []).map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              {selectedSubCategory.startsWith('Other') && (
                <input
                  type="text"
                  required
                  value={customSubCategory}
                  onChange={(e) => setCustomSubCategory(e.target.value)}
                  placeholder={`Specify custom ${selectedCategory.toLowerCase()} type...`}
                  className="mt-2 w-full px-3.5 py-2 rounded-xl border border-blue-400 bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs font-medium text-slate-900"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contact Person Name 
              </label>
              <input
                type="text"
                required
                name="recruiter_name"
                value={formData.recruiter_name}
                onChange={handleChange}
                placeholder="e.g. Dr. Suresh Nambiar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Designation / Role
              </label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="e.g. Placement Officer / Principal / Center Head"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contact Number * (10 Digits)
              </label>
              <input
                type="text"
                required
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="e.g. 9880123456"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alternate Phone / Landline
              </label>
              <input
                type="text"
                name="alternate_mobile"
                value={formData.alternate_mobile}
                onChange={handleChange}
                placeholder="e.g. 04428520261"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. placement@college.edu.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Website
              </label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="e.g. https://www.college.edu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                District *
              </label>
              <select
                value={districtSelect}
                onChange={handleDistrictSelectChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-medium"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {districtSelect !== 'Other' && (() => {
                const meta = DISTRICT_METADATA.find(d => d.district.toLowerCase() === districtSelect.toLowerCase());
                if (!meta) return null;
                // return (
                //   <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                //     <span className={`px-2 py-0.5 rounded-md font-bold ${
                //       meta.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                //       meta.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                //       'bg-blue-50 text-blue-700 border border-blue-200'
                //     }`}>
                //       {meta.priority} Priority
                //     </span>
                   
                //   </div>
                // );
              })()}
            </div>

            {districtSelect === 'Other' ? (
              <div>
                <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider mb-1.5">
                  Enter Custom District Name *
                </label>
                <input
                  type="text"
                  required
                  value={customDistrict}
                  onChange={handleCustomDistrictChange}
                  placeholder="e.g. Karaikal / Pondicherry / Other District"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-blue-500 bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm font-bold text-slate-900 placeholder-slate-400"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  name="taluk"
                  value={formData.taluk}
                  onChange={handleChange}
                  placeholder="e.g. Chennai Zone / Guindy"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Campus / Center Address
              </label>
              <textarea
                rows={2}
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Campus address, landmark..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Student Pool & Program Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">2. Student Pool & Program Specifications</h3>
              <p className="text-xs text-slate-400">Available candidate batches, streams, courses, and placement goals</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Candidate / Student Capacity
              </label>
              <input
                type="number"
                min="0"
                name="candidates_required"
                value={formData.candidates_required}
                onChange={handleChange}
                placeholder="e.g. 200"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-bold text-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Key Programs / Courses / Streams
              </label>
              <input
                type="text"
                name="job_role"
                value={formData.job_role}
                onChange={handleChange}
                placeholder="e.g. BE (CS/ECE), Diploma Mech, Electrician ITI"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expected Salary / Stipend Range
              </label>
              <input
                type="text"
                name="salary_range"
                value={formData.salary_range}
                onChange={handleChange}
                placeholder="e.g. Rs. 18,000 - 25,000 / mo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Qualification / Degree
              </label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                placeholder="e.g. B.Tech, Diploma, ITI, B.Sc, B.Com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Batch Details / Center Highlights
              </label>
              <textarea
                rows={2}
                name="job_description"
                value={formData.job_description}
                onChange={handleChange}
                placeholder="Notes on current batch size, lab facilities, training completion dates..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Sourcing & Staff Assignment */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">3. Sourcing Channel & Staff Ownership</h3>
              <p className="text-xs text-slate-400">CHN SPOC assignment, initial status, and follow-up plan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Sourcing Channel *
              </label>
              <select
                name="lead_source"
                value={formData.lead_source}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-medium"
              >
                {SOURCING_CHANNELS.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Lead Sourced By (Staff Member) *
              </label>
              <select
                name="sourced_by"
                value={formData.sourced_by}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-medium text-slate-800"
              >
                <option value="">Select Sourcing Staff Member</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Staff member who originally brought or sourced this lead.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assigned To
              </label>
              {isAdmin ? (
                <select
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-medium text-slate-800"
                >
                  <option value="">Select Lead Owner</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-sm font-medium text-slate-700">
                  {user?.name ? `${user.name} (You)` : 'Assigned to You'}
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-1">Staff member responsible for handling and follow-ups.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Initial Engagement Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-bold text-blue-700"
              >
                {LEAD_STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Next Follow-up Date (Optional)
              </label>
              <input
                type="date"
                name="next_follow_up_date"
                value={formData.next_follow_up_date}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Remarks & Meeting Notes
              </label>
              <textarea
                rows={2}
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Notes on MOU discussion, campus pool willingness, placement officer availability..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/recruiters"
            className="px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition disabled:opacity-50 text-sm"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Registering...' : 'Save Partner Contact'}
          </button>
        </div>
      </form>
    </div>
  );
};
