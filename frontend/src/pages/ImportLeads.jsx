import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recruiterService } from '../services/recruiterService';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  ArrowRight,
  GraduationCap,
  Download,
  Info
} from 'lucide-react';

export const ImportLeads = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(null);
    }
  };

  const handleUploadPreview = async () => {
    if (!file) {
      error('Please select an Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const data = await recruiterService.previewImport(formData);
      setPreview(data);
      success(`File parsed: ${data.total_rows} records found.`);
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to parse file.');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview?.session_id) return;

    setImporting(true);
    try {
      const res = await recruiterService.confirmImport(preview.session_id, skipDuplicates);
      success(res.message || 'Import completed successfully!');
      navigate('/recruiters');
    } catch (err) {
      error(err.response?.data?.detail || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = 'Sourcing Date,Source,District,Zone,Vendor Type,Vendor Name,SPOC Name,Contact No.,Email Id,Status,Remarks,CHN SPOC Name,Next Followup Date,Comments,Last Connected Date\n' +
      '2026-08-20,Field Visit,Bengaluru Urban,South Zone,Engineering College,RV College of Engineering,Dr. Ramesh Kumar,9845012345,placement@rvce.edu.in,INTERESTED,Agreed for campus pool drive,System Administrator,2026-09-05,Batch size 350,2026-08-22\n' +
      '2026-08-21,Direct Outreach,Mysuru,Central Zone,Skill Training Center,Pratham Skill Center Mysuru,Mr. Suresh Patil,9880123456,suresh@pratham.org,CONFIRMED,Confirmed retail skill batch,System Administrator,2026-09-02,Candidates available 120,2026-08-23\n' +
      '2026-08-22,Referral,Dharwad,North Zone,Polytechnic / Diploma College,KLE Polytechnic Hubballi,Prof. Ananya Rao,9845112233,ananya@kle.edu.in,FOLLOW_UP,Requested placement brochure,System Administrator,2026-09-08,Diploma Electrical & Mech,2026-08-24\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'College_TrainingCenter_Vendor_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Import Colleges, Training Centers & Vendors
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bulk upload institution contact spreadsheets (.xlsx, .xls, .csv)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={downloadSampleTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Download Sample CSV
          </button>
        </div>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:border-blue-500 transition bg-slate-50/50">
          <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>

          <p className="text-sm font-bold text-slate-800">
            {file ? file.name : 'Select or Drag & Drop College / Vendor Spreadsheet'}
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) formats with automatic column mapping
          </p>

          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition">
            <span>Browse Spreadsheet</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="sr-only"
            />
          </label>
        </div>

        {file && !preview && (
          <div className="flex items-center justify-end">
            <button
              onClick={handleUploadPreview}
              disabled={uploading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition disabled:opacity-50"
            >
              {uploading ? 'Parsing Records...' : 'Upload & Preview Data'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {preview && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-scale-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pre-Import Validation Breakdown</h3>
              <p className="text-xs text-slate-400">Review mapped college/vendor records before committing</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                />
                Skip Duplicate Contacts
              </label>

              <button
                onClick={handleConfirmImport}
                disabled={importing || preview.valid_rows_count === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" />
                {importing ? 'Importing...' : 'Confirm & Import All Records'}
              </button>
            </div>
          </div>

          {/* Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Records</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{preview.total_rows}</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Ready to Import</span>
              </div>
              <span className="text-2xl font-black text-emerald-800 mt-1 block">{preview.valid_rows_count}</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-1.5 text-amber-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Duplicate Contacts</span>
              </div>
              <span className="text-2xl font-black text-amber-800 mt-1 block">{preview.duplicate_rows_count}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Errors</span>
              <span className="text-2xl font-black text-slate-400 mt-1 block">{preview.invalid_rows_count}</span>
            </div>
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">College / Vendor Name</th>
                  <th className="p-3">SPOC Name</th>
                  <th className="p-3">Contact No.</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Zone</th>
                  <th className="p-3">CHN SPOC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.preview_data.map((row) => (
                  <tr
                    key={row.row_number}
                    className={
                      row.is_duplicate ? 'bg-amber-50/50' : 'hover:bg-slate-50'
                    }
                  >
                    <td className="p-3 font-mono font-bold text-slate-500">{row.row_number}</td>
                    <td className="p-3">
                      {row.is_duplicate ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-md text-[10px]">
                          Duplicate
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[10px]">
                          Ready
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-slate-900">{row.company_name}</td>
                    <td className="p-3 font-medium text-slate-700">{row.recruiter_name}</td>
                    <td className="p-3 font-mono">{row.mobile}</td>
                    <td className="p-3 text-slate-600">{row.industry}</td>
                    <td className="p-3">{row.district}</td>
                    <td className="p-3">{row.taluk || '-'}</td>
                    <td className="p-3 font-medium text-blue-700">{row.chn_spoc_name || 'System Admin'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
