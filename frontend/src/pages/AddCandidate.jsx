import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { candidateService } from '../services/candidateService';
import { userService } from '../services/userService';
import { useToast } from '../context/ToastContext';
import { DISTRICTS, DISTRICT_METADATA, QUALIFICATIONS, EXPERIENCE_TYPES, PASSOUT_YEARS, CANDIDATE_STATUSES } from '../utils/constants';
import { User, GraduationCap, Briefcase, DollarSign, ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AddCandidate = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { user, isPrivileged } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [districtSelect, setDistrictSelect] = useState('Chennai');
  const [customDistrict, setCustomDistrict] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    contact_number: '',
    alternate_mobile: '',
    email: '',
    location: 'Chennai',
    state: 'Tamil Nadu',
    educational_qualification: 'B.E / B.Tech (Engineering)',
    specialization: 'Computer Science and Engineering',
    college_name: '',
    year_of_passout: '2025',
    position_interested_in: '',
    willing_to_relocate: 'Yes',
    experience_type: 'Fresher',
    total_years_experience: '',
    designation_worked: '',
    current_ctc: '',
    expected_ctc: '',
    status: 'NEW',
    assigned_to: '',
    remarks: ''
  });

  useEffect(() => {
    userService.getSimpleUsers().then((res) => {
      setUsers(res);
      if (res && res.length > 0) {
        if (!isPrivileged && user?.id) {
          setFormData((prev) => ({ ...prev, assigned_to: user.id }));
        } else {
          const meta = DISTRICT_METADATA.find(d => d.district.toLowerCase() === 'chennai');
          const matched = meta ? res.find(u => u.name.toLowerCase().includes(meta.assignedTo.toLowerCase())) : null;
          setFormData((prev) => ({ ...prev, assigned_to: matched ? matched.id : res[0].id }));
        }
      }
    }).catch(() => {});
  }, [isPrivileged, user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDistrictSelectChange = (e) => {
    const val = e.target.value;
    setDistrictSelect(val);
    if (val !== 'Other') {
      const meta = DISTRICT_METADATA.find(d => d.district.toLowerCase() === val.toLowerCase());
      let autoAssignedId = formData.assigned_to;
      if (meta && users.length > 0) {
        const matchedUser = users.find(u => u.name.toLowerCase().includes(meta.assignedTo.toLowerCase()));
        if (matchedUser) {
          autoAssignedId = matchedUser.id;
        }
      }
      setFormData((prev) => ({ ...prev, location: val, assigned_to: autoAssignedId }));
    } else {
      setFormData((prev) => ({ ...prev, location: customDistrict || 'Other' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanMobile = formData.contact_number.replace(/[\s\-\(\)]/g, '').replace(/^(\+91|91|0)/, '');
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      error('Please enter a valid 10-digit Indian mobile number (e.g. 9880123456)');
      return;
    }

    const finalLocation = districtSelect === 'Other' ? (customDistrict.trim() || 'Other') : districtSelect;
    setLoading(true);
    try {
      const payload = {
        ...formData,
        contact_number: cleanMobile,
        location: finalLocation,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null
      };

      const res = await candidateService.createCandidate(payload);
      success(`Candidate registered! ID: ${res.candidate_id}`);
      navigate(`/candidates/${res.id}`);
    } catch (err) {
      error(err.response?.data?.detail || err.message || 'Failed to register candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/candidates"
            className="p-2 bg-white text-slate-500 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Register New Candidate</h2>
            <p className="text-xs text-slate-500 mt-0.5">Add a student, job seeker, or experienced professional</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal & Contact */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">1. Personal & Contact Information</h3>
              <p className="text-xs text-slate-400">Candidate full name, phone number, and location</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Candidate Full Name *</label>
              <input
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Vignesh Kumar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Contact Number (Mobile) *</label>
              <input
                type="text"
                required
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                placeholder="e.g. 9840123456"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. vignesh@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Location (District) *</label>
              <select
                value={districtSelect}
                onChange={handleDistrictSelectChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Education */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">2. Educational Background</h3>
              <p className="text-xs text-slate-400">Degree, college name, branch, and passout year</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Educational Qualification *</label>
              <select
                name="educational_qualification"
                value={formData.educational_qualification}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium"
              >
                {QUALIFICATIONS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Specialization / Branch</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="e.g. Mechanical, Computer Science, ECE, Commerce"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">College / Institution Name</label>
              <input
                type="text"
                name="college_name"
                value={formData.college_name}
                onChange={handleChange}
                placeholder="e.g. PSG College of Technology"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Year of Passout</label>
              <select
                name="year_of_passout"
                value={formData.year_of_passout}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium"
              >
                {PASSOUT_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Career, Experience & CTC */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">3. Career Preferences & Experience</h3>
              <p className="text-xs text-slate-400">Position interested in, relocation, years of experience, and CTC</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Position Interested In</label>
              <input
                type="text"
                name="position_interested_in"
                value={formData.position_interested_in}
                onChange={handleChange}
                placeholder="e.g. Software Engineer / CNC Operator / Sales Executive"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Willing to Relocate?</label>
              <select
                name="willing_to_relocate"
                value={formData.willing_to_relocate}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium"
              >
                <option value="Yes">Yes (Anywhere in Tamil Nadu)</option>
                <option value="Yes - Pan India">Yes (Pan India)</option>
                <option value="No - Local Only">No (Local District Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Experience Type</label>
              <select
                name="experience_type"
                value={formData.experience_type}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium"
              >
                <option value="Fresher">Fresher</option>
                <option value="Experienced">Experienced</option>
              </select>
            </div>

            {formData.experience_type === 'Experienced' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Total Years of Experience</label>
                  <input
                    type="text"
                    name="total_years_experience"
                    value={formData.total_years_experience}
                    onChange={handleChange}
                    placeholder="e.g. 2 Years"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Designation Worked</label>
                  <input
                    type="text"
                    name="designation_worked"
                    value={formData.designation_worked}
                    onChange={handleChange}
                    placeholder="e.g. Junior Developer / Machine Operator"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Current CTC</label>
                  <input
                    type="text"
                    name="current_ctc"
                    value={formData.current_ctc}
                    onChange={handleChange}
                    placeholder="e.g. 3.0 LPA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Expected CTC</label>
              <input
                type="text"
                name="expected_ctc"
                value={formData.expected_ctc}
                onChange={handleChange}
                placeholder="e.g. 4.5 LPA / Negotiable"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pipeline Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium"
              >
                {CANDIDATE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Assigned Sourcing Staff</label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/candidates"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving Candidate...' : 'Save Candidate Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};
