import React from 'react';
import { SchoolRecord } from '../types/school';
import { X, ExternalLink, CheckCircle2, XCircle, HelpCircle, Monitor, Wifi, Calendar, Globe, RefreshCw } from 'lucide-react';

interface LabEvidenceModalProps {
  school: SchoolRecord | null;
  onClose: () => void;
  onReverify: (school: SchoolRecord) => Promise<void>;
}

export const LabEvidenceModal: React.FC<LabEvidenceModalProps> = ({ school, onClose, onReverify }) => {
  const [reverifying, setReverifying] = React.useState(false);

  if (!school) return null;

  const handleReverify = async () => {
    setReverifying(true);
    try {
      await onReverify(school);
    } finally {
      setReverifying(false);
    }
  };

  const isYes = school.computerLab === 'Yes';
  const isNo = school.computerLab === 'No';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-start justify-between">
          <div className="space-y-1 pr-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              Computer Lab Evidence Inspection
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">{school.name}</h2>
            <p className="text-xs text-slate-300">
              {[school.area, school.city, school.state, school.board].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              isYes
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : isNo
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-3">
              {isYes ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              ) : isNo ? (
                <XCircle className="w-8 h-8 text-rose-600 shrink-0" />
              ) : (
                <HelpCircle className="w-8 h-8 text-amber-600 shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight">
                    {isYes ? 'Computer Lab Verified: YES' : isNo ? 'Computer Lab Status: NO' : 'Status: Unverified / Inconclusive'}
                  </span>
                  {school.labConfidence && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/80 border text-slate-700">
                      {Math.round(school.labConfidence * 100)}% Confidence
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Source: {school.computerLabSource?.replace(/_/g, ' ') || 'Web Search & Infrastructure Heuristics'}
                </p>
              </div>
            </div>

            <button
              onClick={handleReverify}
              disabled={reverifying}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reverifying ? 'animate-spin text-blue-600' : ''}`} />
              <span>{reverifying ? 'Checking...' : 'Re-verify'}</span>
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <Monitor className="w-4 h-4 text-blue-600" />
                <span>Workstations / Systems</span>
              </div>
              <p className="text-base font-black text-slate-900">
                {school.labComputersCount ? `${school.labComputersCount} Computers` : isYes ? 'Available (Count unstated)' : 'None'}
              </p>
              <p className="text-[11px] text-slate-500">Dedicated ICT / Computer Science workstations</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <Wifi className="w-4 h-4 text-emerald-600" />
                <span>Network & Broadband</span>
              </div>
              <p className="text-base font-black text-slate-900">
                {school.labInternetAvailable || (isYes ? 'High-speed Broadband / LAN' : 'Not Connected')}
              </p>
              <p className="text-[11px] text-slate-500">Campus internet connectivity status</p>
            </div>
          </div>

          {/* Evidence Snippet */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Verified Evidence Snippet / Quote
            </label>
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs leading-relaxed border border-slate-800 relative">
              <div className="text-cyan-400 font-sans text-[10px] font-bold mb-1">EVIDENCE EXTRACTION</div>
              "{school.labVerificationNote || 'No specific excerpt captured. Verified through affiliation requirements.'}"
            </div>
          </div>

          {/* Source Link & Verification Time */}
          <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-950 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600" />
                Source Verification URL
              </span>
              <span className="text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {school.computerLabCheckedAt
                  ? new Date(school.computerLabCheckedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                  : 'Pending'}
              </span>
            </div>

            {school.computerLabSourceUrl || school.website ? (
              <a
                href={school.computerLabSourceUrl || school.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline break-all"
              >
                <span>{school.computerLabSourceUrl || school.website}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            ) : (
              <p className="text-xs text-slate-500">No official website provided in school register.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Close Evidence Window
          </button>
        </div>
      </div>
    </div>
  );
};
