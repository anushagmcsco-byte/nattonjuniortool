import React from 'react';
import { UserSession } from '../types/school';
import { 
  FileText, 
  Target, 
  Compass, 
  Smartphone, 
  Upload, 
  HelpCircle, 
  LogOut,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  session: UserSession | null;
  hasSchools?: boolean;
  onOpenUpload: () => void;
  onOpenGuide: () => void;
  onSignOut: () => void;
  onClearSchools?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  session,
  hasSchools,
  onOpenUpload,
  onOpenGuide,
  onSignOut,
  onClearSchools,
}) => {
  const isSuperAdmin = session?.role === 'SUPER_ADMIN';

  return (
    <header className="brand-header sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      {/* Micro ticker top bar */}
      <div className="bg-slate-950 text-white text-[11px] py-1 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-300">
            NATTONSKILLXJUNIOR • Daily Progress Report (DPR) & Priority Targeting Suite
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">
            Role Access: <strong className="text-white">{session?.role.replace(/_/g, ' ') || 'USER'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {hasSchools && onClearSchools && (
            <button
              onClick={onClearSchools}
              className="px-2 py-0.5 bg-slate-800 hover:bg-rose-900 text-rose-300 hover:text-white rounded text-[10px] font-bold transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer"
              title="Clear active school register"
            >
              <span>Clear Register</span>
            </button>
          )}

          <button
            onClick={onOpenGuide}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white rounded text-[10px] font-bold transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer"
            title="View Environment Variables & Setup Guide"
          >
            <HelpCircle className="w-3 h-3 text-emerald-400" />
            <span>Env Config & Guide</span>
          </button>

          <span className="text-slate-300 font-medium hidden sm:inline">
            {session?.name || 'Account'} ({session?.zone?.split('(')[0] || 'Zone'})
          </span>

          <button
            onClick={onSignOut}
            className="px-2 py-0.5 bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-white rounded text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main header row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand logo & role */}
        <div
          onClick={() => onTabChange('SCHOOL_LABS')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <img
            src="/skillx-junior.png"
            alt="Natton SkillX Junior"
            className="brand-logo w-40 h-16 object-contain p-1"
          />
          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border">
            {session?.role.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Desktop Navbar Tabs (XL) */}
        <nav className="hidden xl:flex w-full order-last items-center gap-1.5 whitespace-nowrap pt-1">
          <button
            onClick={() => onTabChange('DPR_CONSOLE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTab === 'DPR_CONSOLE'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Reports</span>
          </button>

          <button
            onClick={() => onTabChange('SCHOOL_LABS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'SCHOOL_LABS'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            School Labs & Route
          </button>

          <button
            onClick={() => onTabChange('PRIORITY_TARGETING')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTab === 'PRIORITY_TARGETING'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Target className="w-4 h-4 text-rose-600" />
            <span>Targets</span>
          </button>

          <button
            onClick={() => onTabChange('ROADMAP_EXPORTS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTab === 'ROADMAP_EXPORTS'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Roadmap</span>
          </button>

          <button
            onClick={() => onTabChange('MOBILE_APP')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentTab === 'MOBILE_APP'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>Mobile</span>
          </button>

          <button
            onClick={() => onTabChange('REVIEWS')}
            className={`shrink-0 whitespace-nowrap px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
              currentTab === 'REVIEWS'
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            Add Review (Person Met)
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => onTabChange('REVIEWS')}
              className={`shrink-0 whitespace-nowrap px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                currentTab === 'REVIEW_ADMIN'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              Manage Reviews
            </button>
          )}
        </nav>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenUpload}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Import schools from Excel / CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
            title="Environment Variables & Step-by-Step Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Setup</span>
          </button>

          <div className="hidden sm:flex flex-col text-right pl-2 border-l border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Monthly Quota</span>
            <span className="text-xs font-extrabold text-slate-800 font-mono">
              {session?.monthlyTarget || 24} Schools ({session?.weeklyTarget || 6}/wk)
            </span>
          </div>
        </div>
      </div>

      {/* Sub-navbar on medium & mobile screens */}
      <div className="xl:hidden flex items-center gap-1.5 px-4 py-2 bg-slate-50 border-t border-slate-200 overflow-x-auto text-xs">
        <button
          onClick={() => onTabChange('SCHOOL_LABS')}
          className={`px-2.5 py-1 rounded-lg shrink-0 font-bold cursor-pointer ${
            currentTab === 'SCHOOL_LABS' ? 'bg-blue-600 text-white' : 'text-slate-700 bg-white border'
          }`}
        >
          School Labs & Route
        </button>
        <button
          onClick={() => onTabChange('PRIORITY_TARGETING')}
          className={`px-2.5 py-1 rounded-lg shrink-0 font-bold cursor-pointer ${
            currentTab === 'PRIORITY_TARGETING' ? 'bg-blue-600 text-white' : 'text-slate-700 bg-white border'
          }`}
        >
          Targets
        </button>
        <button
          onClick={() => onTabChange('DPR_CONSOLE')}
          className={`px-2.5 py-1 rounded-lg shrink-0 font-bold cursor-pointer ${
            currentTab === 'DPR_CONSOLE' ? 'bg-blue-600 text-white' : 'text-slate-700 bg-white border'
          }`}
        >
          Reports
        </button>
        <button
          onClick={() => onTabChange('ROADMAP_EXPORTS')}
          className={`px-2.5 py-1 rounded-lg shrink-0 font-bold cursor-pointer ${
            currentTab === 'ROADMAP_EXPORTS' ? 'bg-blue-600 text-white' : 'text-slate-700 bg-white border'
          }`}
        >
          Roadmap
        </button>
        <button
          onClick={() => onTabChange('MOBILE_APP')}
          className={`px-2.5 py-1 rounded-lg shrink-0 font-bold cursor-pointer ${
            currentTab === 'MOBILE_APP' ? 'bg-blue-600 text-white' : 'text-slate-700 bg-white border'
          }`}
        >
          Mobile
        </button>
        <button
          onClick={() => onTabChange('REVIEWS')}
          className={`px-2.5 py-1 rounded-lg shrink-0 font-bold cursor-pointer ${
            currentTab === 'REVIEWS' ? 'bg-blue-600 text-white' : 'text-slate-700 bg-white border'
          }`}
        >
          Reviews & Person Met
        </button>
        <button
          onClick={onOpenUpload}
          className="px-2.5 py-1 rounded-lg shrink-0 font-bold bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer ml-auto"
        >
          + Import
        </button>
      </div>
    </header>
  );
};
