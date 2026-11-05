import React from 'react';
import { X, CheckCircle2, ShieldCheck, Terminal, Cpu, ArrowRight } from 'lucide-react';

interface EnvConfigModalProps {
  onClose: () => void;
}

export const EnvConfigModal: React.FC<EnvConfigModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-600/30 text-cyan-400 border border-cyan-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">System Architecture & Fix Documentation</h2>
              <p className="text-xs text-slate-400">
                Natton SkillX Junior • Campus Lab Finder Engine v2.4
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-700">
          {/* Resolved Issue Section */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Resolved: Background Runner Freezing & Infinite Loop</span>
            </div>
            <p className="text-emerald-950 leading-relaxed">
              In earlier releases (such as on <code>campus-lab-finder.lovable.app</code>), the verification loop fired recursive <code>setTimeout(kickLabVerification, 1500)</code> requests without terminating when schools lacked websites or when the dataset pointer reached the end of the file.
            </p>
            <div className="bg-white p-3 rounded-xl border border-emerald-200 font-mono text-[11px] text-slate-800 space-y-1">
              <div className="text-emerald-700 font-bold font-sans">KEY RESOLUTIONS APPLIED:</div>
              <div>1. <strong>Bounded Sequential Pipeline:</strong> Loops strictly across <code>0</code> to <code>schools.length - 1</code> with guaranteed per-row completion.</div>
              <div>2. <strong>Auto-Stop Guarantee:</strong> When <code>i &gt;= schools.length</code>, calls <code>cleanup('COMPLETE')</code>, clears intervals, and halts all background requests immediately.</div>
              <div>3. <strong>Full Field Enrichment:</strong> Updates Lab Status (Yes/No), Computers Count, Broadband status, source quote, and timestamp for all rows.</div>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-blue-600" />
              <span>Environment Configuration (.env)</span>
            </h3>
            <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] space-y-2">
              <p><span className="text-cyan-400">GEMINI_API_KEY</span>="AIzaSy..." <span className="text-slate-500"># Optional AI extraction</span></p>
              <p><span className="text-cyan-400">VITE_APP_TITLE</span>="NATTONSKILLXJUNIOR"</p>
              <p><span className="text-cyan-400">VITE_APP_SUBTITLE</span>="School Computer Lab Finder & DPR"</p>
              <p><span className="text-cyan-400">VITE_DEFAULT_MONTHLY_VISIT_TARGET</span>=24</p>
              <p><span className="text-cyan-400">VITE_DEFAULT_WEEKLY_VISIT_TARGET</span>=6</p>
            </div>
          </div>

          {/* Role Credentials */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-600" />
              <span>Built-in Demo User Roles</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-3 bg-slate-50 rounded-xl border">
                <span className="font-bold block text-slate-900">Super Admin</span>
                <span className="text-slate-500 text-[10px]">superadmin@nattonskillx.in</span>
                <span className="text-[10px] text-purple-700 font-bold block mt-1">All State Access</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border">
                <span className="font-bold block text-slate-900">Admin</span>
                <span className="text-slate-500 text-[10px]">nattonskillxjunior@gmail.com</span>
                <span className="text-[10px] text-blue-700 font-bold block mt-1">State Lead / Approver</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border">
                <span className="font-bold block text-slate-900">Field Officer</span>
                <span className="text-slate-500 text-[10px]">rohan.field@nattonskillx.in</span>
                <span className="text-[10px] text-emerald-700 font-bold block mt-1">Field Visit Logger</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Dismiss Guide
          </button>
        </div>
      </div>
    </div>
  );
};
