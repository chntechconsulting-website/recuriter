import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { candidateService } from '../services/candidateService';
import { userService } from '../services/userService';
import { useToast } from '../context/ToastContext';
import { DISTRICTS, QUALIFICATIONS, PASSOUT_YEARS, CANDIDATE_STATUSES } from '../utils/constants';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { User, GraduationCap, Briefcase, ArrowLeft, Save } from 'lucide-react';

export const EditCandidate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contact_number: '',
    alternate_mobile: '',
    email: '',
    location: '',
    state: 'Tamil Nadu',
    educational_qualification: '',
    specialization: '',
    college_name: '',
    year_of_passout: '',
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
    const load = async () => {
      try {
        const [cand, userList] = await Promise.all([
          candidateService.getCandidateById(id),
          userService.getSimpleUsers()
        ]);
        setUsers(userList);
        setFormData({
          name: cand.name || '',
          contact_number: cand.contact_number || '',
          alternate_mobile: cand.alternate_mobile || '',
          email: cand.email || '',
          location: cand.location || 'Chennai',
          state: cand.state || 'Tamil Nadu',
          educational_qualification: cand.educational_qualification || '',
          specialization: cand.specialization || '',
          college_name: cand.college_name || '',
          year_of_passout: cand.year_of_passout || '',
          position_interested_in: cand.position_interested_in || '',
          willing_to_relocate: cand.willing_to_relocate || 'Yes',
          experience_type: cand.experience_type || 'Fresher',
          total_years_experience: cand.total_years_experience || '',
          designation_worked: cand.designation_worked || '',
          current_ctc: cand.current_ctc || '',
          expected_ctc: cand.expected_ctc || '',
          status: cand.status || 'NEW',
          assigned_to: cand.assigned_to || '',
          remarks: cand.remarks || ''
        });
      } catch {
        error('Failed to load candidate details');
        navigate('/candidates');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate, error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null
      };
      await candidateService.updateCandidate(id, payload);
      success('Candidate updated successfully');
      navigate(`/candidates/${id}`);
    } catch {
      error('Failed to update candidate profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner text="Loading candidate details..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/candidates/${id}`}
            className="p-2 bg-white text-slate-500 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Edit Candidate Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">Editing: {formData.name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Personal & Contact Info</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Candidate Name *</label>
              <input
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Contact Number *</label>
              <input
                type="text"
                required
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email ID</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Location</label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Educational Qualification</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Qualification</label>
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Specialization</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">College Name</label>
              <input
                type="text"
                name="college_name"
                value={formData.college_name}
                onChange={handleChange}
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

        {/* Experience & CTC */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Experience & Career</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Position Interested In</label>
              <input
                type="text"
                name="position_interested_in"
                value={formData.position_interested_in}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
              />
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

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Current CTC</label>
              <input
                type="text"
                name="current_ctc"
                value={formData.current_ctc}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Expected CTC</label>
              <input
                type="text"
                name="expected_ctc"
                value={formData.expected_ctc}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Status</label>
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

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to={`/candidates/${id}`}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};
