import React, { useState } from 'react';
import { UserSession } from '../types/school';
import { 
  FileText, 
  Target, 
  Compass, 
  Smartphone, 
  Upload, 
  HelpCircle, 
  LogOut,
  ChevronDown,
  Menu,
  X,
  Trash2,
  Building,
  Star,
  CheckCircle2,
  Clock
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isSuperAdmin = session?.role === 'SUPER_ADMIN';

  const navItems = [
    { id: 'SCHOOL_LABS', label: 'School Labs & Route', icon: Building, color: 'text-blue-600' },
    { id: 'PRIORITY_TARGETING', label: 'Targets', icon: Target, color: 'text-rose-600' },
    { id: 'DPR_CONSOLE', label: 'Reports', icon: FileText, color: 'text-indigo-600' },
    { id: 'ROADMAP_EXPORTS', label: 'Roadmap & Quotas', icon: Compass, color: 'text-emerald-600', badge: '9to3' },
    { id: 'MOBILE_APP', label: 'Mobile App', icon: Smartphone, color: 'text-purple-600' },
    { id: 'REVIEWS', label: 'Reviews & Person Met', icon: Star, color: 'text-amber-600' },
  ];

  const handleMobileNavClick = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="brand-header sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs w-full max-w-full">
      {/* Micro ticker top bar - Fully Responsive */}
      <div className="bg-slate-950 text-white text-[11px] py-1 px-3 sm:px-4 flex items-center justify-between w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-semibold text-slate-300 truncate max-w-[160px] xs:max-w-[240px] sm:max-w-none">
            NATTON SKILLX JUNIOR
          </span>
          <span className="text-slate-500 hidden md:inline">|</span>
          <span className="text-slate-400 hidden md:inline">
            Role: <strong className="text-white">{session?.role.replace(/_/g, ' ') || 'USER'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 text-[10px]">
          {hasSchools && onClearSchools && (
            <button
              onClick={onClearSchools}
              className="px-2 py-0.5 bg-slate-800 hover:bg-rose-900 text-rose-300 hover:text-white rounded font-bold transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer"
              title="Clear active school register"
            >
              <Trash2 className="w-2.5 h-2.5 sm:hidden" />
              <span className="hidden sm:inline">Clear Register</span>
              <span className="sm:hidden">Clear</span>
            </button>
          )}

          <button
            onClick={onOpenGuide}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white rounded font-bold transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer"
            title="View Setup Guide & Environment"
          >
            <HelpCircle className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">Env Config & Guide</span>
            <span className="sm:hidden">Guide</span>
          </button>

          <span className="text-slate-300 font-medium hidden lg:inline">
            {session?.name || 'Account'} ({session?.zone?.split('(')[0] || 'Zone'})
          </span>

          <button
            onClick={onSignOut}
            className="px-2 py-0.5 bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-white rounded font-bold transition-colors flex items-center gap-1 cursor-pointer"
            title="Sign out of account"
          >
            <LogOut className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main header row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 w-full max-w-full">
        {/* Brand logo & role badge */}
        <div
          onClick={() => onTabChange('SCHOOL_LABS')}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <img
            src="/skillx-junior.png"
            alt="Natton SkillX Junior"
            className="brand-logo w-32 sm:w-40 h-11 sm:h-14 object-contain p-1"
          />
          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border hidden xs:inline">
            {session?.role.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Desktop Navbar Tabs (XL) */}
        <nav className="hidden xl:flex items-center gap-1.5 whitespace-nowrap">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.color}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-black">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Import schools from Excel / CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Import Excel</span>
            <span className="xs:hidden">Import</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
            title="Environment Variables & Step-by-Step Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Setup</span>
          </button>

          <div className="hidden lg:flex flex-col text-right pl-2 border-l border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Monthly Target</span>
            <span className="text-xs font-extrabold text-slate-800 font-mono">
              {session?.monthlyTarget || 72} Schools
            </span>
          </div>

          {/* Mobile Hamburger Button (XL:hidden) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-800" />}
          </button>
        </div>
      </div>

      {/* Touch-Scrollable Sub-navbar on medium & mobile screens */}
      <div className="xl:hidden w-full max-w-full bg-slate-50 border-t border-slate-200 py-2 px-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.color}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`px-1 py-0.2 rounded text-[9px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Drawer / Overlay Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-x-0 top-[90px] bottom-0 z-50 bg-slate-950/40 backdrop-blur-xs flex flex-col justify-start">
          <div className="bg-white border-b border-slate-200 p-4 shadow-xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="font-black text-slate-900 text-sm">{session?.name || 'Field Officer'}</div>
                <div className="text-xs text-slate-500">{session?.designation} • {session?.zone}</div>
              </div>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {session?.role.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1">
                Navigation Modules
              </span>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMobileNavClick(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-black">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2">
                Quick Actions
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenUpload();
                    setMobileMenuOpen(false);
                  }}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Excel</span>
                </button>
                <button
                  onClick={() => {
                    onOpenGuide();
                    setMobileMenuOpen(false);
                  }}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Setup Guide</span>
                </button>
              </div>

              {hasSchools && onClearSchools && (
                <button
                  onClick={() => {
                    onClearSchools();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-2.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Clear Current Register</span>
                </button>
              )}

              <button
                onClick={() => {
                  onSignOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full p-2.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
