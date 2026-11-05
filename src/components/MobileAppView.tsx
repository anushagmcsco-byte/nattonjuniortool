import React, { useState } from 'react';
import { SchoolRecord, UserSession } from '../types/school';
import { store } from '../services/store';
import { 
  Smartphone, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Monitor, 
  Send, 
  Search, 
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface MobileAppViewProps {
  schools: SchoolRecord[];
  session: UserSession | null;
  onRefreshData?: () => void;
}

export const MobileAppView: React.FC<MobileAppViewProps> = ({ schools, session }) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || '');
  const [labStatus, setLabStatus] = useState<'Yes' | 'No'>('Yes');
  const [computersCount, setComputersCount] = useState<number>(24);
  const [notes, setNotes] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const currentSchool = schools.find((s) => s.id === selectedSchoolId);

  const filtered = schools.filter((s) =>
    search ? s.name.toLowerCase().includes(search.toLowerCase()) || s.area.toLowerCase().includes(search.toLowerCase()) : true
  );

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSchool) return;

    store.addReport({
      schoolId: currentSchool.id,
      schoolName: currentSchool.name,
      schoolArea: currentSchool.area,
      officerId: session?.id || 'usr-field-01',
      officerName: session?.name || 'Field Officer',
      visitDate: new Date().toISOString().slice(0, 10),
      visitDurationMinutes: 30,
      keyPersonMet: 'On-site Contact / Lab Supervisor',
      discussionNotes: notes || 'Verified lab status via Mobile DPR console.',
      computerLabObserved: labStatus,
      computersCountObserved: labStatus === 'Yes' ? computersCount : 0,
      internetWorking: labStatus === 'Yes',
      actionItems: 'Follow up on lab upgrade program.',
      approvalStatus: 'SUBMITTED',
    });

    setSuccessMsg(`Mobile DPR logged for ${currentSchool.name}!`);
    setTimeout(() => setSuccessMsg(''), 3000);
    setNotes('');
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Mobile Frame Simulation */}
      <div className="bg-slate-900 rounded-[40px] p-4 shadow-2xl border-4 border-slate-800">
        <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3" />

        <div className="bg-white rounded-[32px] overflow-hidden min-h-[600px] flex flex-col justify-between">
          {/* Mobile Header */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" /> Mobile Field Agent
              </span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                {session?.avatarInitials || 'NX'}
              </span>
            </div>
            <h1 className="text-lg font-black tracking-tight">{session?.name || 'Field Officer'}</h1>
            <p className="text-[11px] text-blue-100">{session?.zone || 'Bengaluru Corridor'}</p>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs">
            {successMsg && (
              <div className="p-3 bg-emerald-100 text-emerald-900 font-bold rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Search or Select school */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Select Target Campus</label>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
              >
                {filtered.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.area})
                  </option>
                ))}
              </select>
            </div>

            {currentSchool && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">{currentSchool.name}</h3>
                    <p className="text-[11px] text-slate-500">
                      {currentSchool.area} · {currentSchool.board}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      currentSchool.computerLab === 'Yes'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentSchool.computerLab === 'No'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Lab: {currentSchool.computerLab || 'Unverified'}
                  </span>
                </div>

                {currentSchool.mapsUrl && (
                  <a
                    href={currentSchool.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-700 font-bold text-[11px] hover:underline"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Open in Maps for turn-by-turn driving</span>
                  </a>
                )}
              </div>
            )}

            {/* Quick Field Lab Inspection Form */}
            <form onSubmit={handleQuickSubmit} className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Did you inspect the computer lab?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLabStatus('Yes')}
                    className={`p-2.5 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      labStatus === 'Yes'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lab Active (Yes)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLabStatus('No')}
                    className={`p-2.5 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all ${
                      labStatus === 'No'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>No Lab Present</span>
                  </button>
                </div>
              </div>

              {labStatus === 'Yes' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Observed Computers Count</label>
                  <input
                    type="number"
                    value={computersCount}
                    onChange={(e) => setComputersCount(parseInt(e.target.value, 10))}
                    className="w-full p-2 bg-slate-50 border rounded-xl font-bold"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Visit Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Met with IT head, discussed training..."
                  className="w-full p-2 bg-slate-50 border rounded-xl font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Instant Visit Log</span>
              </button>
            </form>
          </div>

          {/* Mobile Footer */}
          <div className="p-3 bg-slate-50 border-t text-center text-[10px] text-slate-400 font-medium">
            Natton SkillX Junior Mobile Field Client v2.4
          </div>
        </div>
      </div>
    </div>
  );
};
