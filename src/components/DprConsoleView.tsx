import React, { useState } from 'react';
import { SchoolRecord, DPRReport, UserSession } from '../types/school';
import { store } from '../services/store';
import { FileText, Plus, CheckCircle2, AlertCircle, Clock, Calendar, User, Check, Send, UserCheck } from 'lucide-react';
import { extractAreaFromSchool } from '../utils/areaExtractor';

interface DprConsoleViewProps {
  schools: SchoolRecord[];
  reports: DPRReport[];
  session: UserSession | null;
  preselectedSchool?: SchoolRecord | null;
  onClearPreselected?: () => void;
}

export const DprConsoleView: React.FC<DprConsoleViewProps> = ({
  schools,
  reports,
  session,
  preselectedSchool,
  onClearPreselected,
}) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    preselectedSchool?.id || (schools[0]?.id || '')
  );
  const [visitDate, setVisitDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [duration, setDuration] = useState<number>(45);
  const [keyPerson, setKeyPerson] = useState<string>('');
  const [discussion, setDiscussion] = useState<string>('');
  const [labObserved, setLabObserved] = useState<'Yes' | 'No' | 'Partial'>('Yes');
  const [computersCount, setComputersCount] = useState<number>(25);
  const [internetWorking, setInternetWorking] = useState<boolean>(true);
  const [actionItems, setActionItems] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId);

  const handleSubmitDPR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;

    store.addReport({
      schoolId: selectedSchool.id,
      schoolName: selectedSchool.name,
      schoolArea: selectedSchool.area,
      officerId: session?.id || 'usr-field-01',
      officerName: session?.name || 'Field Officer',
      visitDate,
      visitDurationMinutes: duration,
      keyPersonMet: keyPerson || 'Principal / Administrator',
      discussionNotes: discussion || 'Routine curriculum review and computer laboratory inspection.',
      computerLabObserved: labObserved,
      computersCountObserved: labObserved === 'Yes' ? computersCount : 0,
      internetWorking: labObserved === 'Yes' ? internetWorking : false,
      actionItems: actionItems || 'Send follow-up communication regarding junior technical skills program.',
      followUpDueDate: followUpDate || undefined,
      approvalStatus: 'SUBMITTED',
    });

    setFormSuccess(`Daily Progress Report for ${selectedSchool.name} submitted successfully!`);
    setTimeout(() => setFormSuccess(''), 4000);

    // Reset fields
    setKeyPerson('');
    setDiscussion('');
    setActionItems('');
    if (onClearPreselected) onClearPreselected();
  };

  const handleApprove = (reportId: string) => {
    store.updateReportStatus(reportId, 'APPROVED_BY_ADMIN', 'Verified and approved by admin.');
  };

  const isAdmin = session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Field Operations Console</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Daily Progress Report (DPR) & Visit Log
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Record on-site school visits, capture verified computer lab observations, and track executive action items.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-4 py-2 rounded-2xl">
          <span>{reports.length} Reports Logged</span>
        </div>
      </div>

      {formSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Main Grid: Entry Form + History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900">Log New School Visit DPR</h2>
            <p className="text-xs text-slate-500">Officer: {session?.name || 'Field Officer'}</p>
          </div>

          <form onSubmit={handleSubmitDPR} className="space-y-4 text-xs">
            {/* School Selector */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Select Target School *</label>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                disabled={schools.length === 0}
                required
              >
                {schools.length === 0 ? (
                  <option value="">No schools available. Upload a school register first.</option>
                ) : (
                  schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({extractAreaFromSchool(s.name, s.area, s.city)})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Visit Date</label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Duration (Mins)</label>
                <input
                  type="number"
                  min="10"
                  max="360"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Key Person Met */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Key Person Met *</label>
              <input
                type="text"
                value={keyPerson}
                onChange={(e) => setKeyPerson(e.target.value)}
                placeholder="e.g. Dr. Manisha Sharma (Principal)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                required
              />
            </div>

            {/* On-Site Computer Lab Verification */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
              <span className="font-black text-blue-950 block text-[11px] uppercase tracking-wider">
                Field Inspection: Computer Lab
              </span>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                  <input
                    type="radio"
                    name="labObserved"
                    checked={labObserved === 'Yes'}
                    onChange={() => setLabObserved('Yes')}
                  />
                  <span>Lab Operational (Yes)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                  <input
                    type="radio"
                    name="labObserved"
                    checked={labObserved === 'No'}
                    onChange={() => setLabObserved('No')}
                  />
                  <span>No Lab Present</span>
                </label>
              </div>

              {labObserved === 'Yes' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">Systems Count</label>
                    <input
                      type="number"
                      value={computersCount}
                      onChange={(e) => setComputersCount(parseInt(e.target.value, 10))}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block">Internet / WiFi</label>
                    <select
                      value={internetWorking ? 'true' : 'false'}
                      onChange={(e) => setInternetWorking(e.target.value === 'true')}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                    >
                      <option value="true">Active & Fast</option>
                      <option value="false">No Connectivity</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Discussion Notes */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Discussion Notes & Outcomes *</label>
              <textarea
                rows={3}
                value={discussion}
                onChange={(e) => setDiscussion(e.target.value)}
                placeholder="Details of conversation, school requirements, and interest level..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                required
              />
            </div>

            {/* Action Items */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Next Steps & Action Items</label>
              <input
                type="text"
                value={actionItems}
                onChange={(e) => setActionItems(e.target.value)}
                placeholder="e.g. Deliver proposal, schedule lab demonstration"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit Daily Progress Report</span>
            </button>
          </form>
        </div>

        {/* DPR Logs List */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900">Recent DPR Field Logs</h2>
            <span className="text-xs text-slate-500">{reports.length} Records</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[680px]">
            {reports.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-xs">
                No DPR reports submitted yet. Submit your first field visit report on the left.
              </p>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">{rep.schoolName}</h3>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-[11px] text-slate-600 font-medium">
                          {rep.schoolArea || 'Hubli'}
                        </span>
                        <span className="text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 inline-flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-blue-600" />
                          <span>Person Met: {rep.keyPersonMet}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          rep.approvalStatus === 'APPROVED_BY_ADMIN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rep.approvalStatus.replace(/_/g, ' ')}
                      </span>

                      {isAdmin && rep.approvalStatus === 'SUBMITTED' && (
                        <button
                          onClick={() => handleApprove(rep.id)}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">
                    "{rep.discussionNotes}"
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-slate-600">
                    <div className="p-2 bg-white rounded-lg border">
                      <span className="text-slate-400 block font-bold">Computer Lab</span>
                      <span className="font-bold text-slate-800">
                        {rep.computerLabObserved === 'Yes'
                          ? `Yes (${rep.computersCountObserved || 20} PCs)`
                          : 'No Lab'}
                      </span>
                    </div>

                    <div className="p-2 bg-white rounded-lg border">
                      <span className="text-slate-400 block font-bold">Officer</span>
                      <span className="font-bold text-slate-800">{rep.officerName}</span>
                    </div>

                    <div className="p-2 bg-white rounded-lg border">
                      <span className="text-slate-400 block font-bold">Visit Date & Duration</span>
                      <span className="font-bold text-slate-800">
                        {rep.visitDate} ({rep.visitDurationMinutes}m)
                      </span>
                    </div>
                  </div>

                  {rep.actionItems && (
                    <div className="text-[11px] text-blue-900 bg-blue-50/70 p-2 rounded-xl border border-blue-100">
                      <strong>Action Item:</strong> {rep.actionItems}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
