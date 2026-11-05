import React, { useState } from 'react';
import { UserSession, UserRole } from '../types/school';
import { DEMO_ACCOUNTS } from '../data/sampleSchools';
import { store } from '../services/store';
import { ShieldCheck, Crown, Shield, User, Info, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');
  const [email, setEmail] = useState<string>('rohan.field@nattonskillx.in');
  const [password, setPassword] = useState<string>('password123');
  const [error, setError] = useState<string | null>(null);

  const handleRoleTabClick = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    if (role === 'SUPER_ADMIN') {
      setEmail('superadmin@nattonskillx.in');
      setPassword('password123');
    } else if (role === 'ADMIN') {
      setEmail('nattonskillxjunior@gmail.com');
      setPassword('nattonskillxjunior@123');
    } else {
      setEmail('rohan.field@nattonskillx.in');
      setPassword('password123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate credentials against accounts
    const account = Object.values(DEMO_ACCOUNTS).find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (account && (account.demoPassword === password || password === 'password123' || password === 'nattonskillxjunior@123')) {
      store.setSession(account);
      onLoginSuccess(account);
    } else {
      // Allow fallback login matching selected tier
      const fallback = selectedRole === 'SUPER_ADMIN' ? DEMO_ACCOUNTS.superadmin : selectedRole === 'ADMIN' ? DEMO_ACCOUNTS.admin : DEMO_ACCOUNTS.user;
      store.setSession(fallback);
      onLoginSuccess(fallback);
    }
  };

  const handleQuickLogin = (key: 'superadmin' | 'admin' | 'user') => {
    const acc = DEMO_ACCOUNTS[key];
    if (acc) {
      store.setSession(acc);
      onLoginSuccess(acc);
    }
  };

  return (
    <div className="brand-login min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-xl space-y-6">
        {/* Brand Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Role-Based Institutional Access Gateway</span>
          </div>

          <div className="py-2">
            <img
              src="/skillx-junior.png"
              alt="Natton SkillX Junior"
              className="brand-logo w-64 mx-auto p-2 object-contain"
            />
          </div>

          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Daily Progress Report (DPR) System, Intelligent Priority Targeting & Roadmap Generation
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Select Your Access Tier / Login Tab:
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleRoleTabClick('SUPER_ADMIN')}
                className={`py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedRole === 'SUPER_ADMIN'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="truncate">Super Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabClick('ADMIN')}
                className={`py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedRole === 'ADMIN'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-4 h-4 text-blue-200" />
                <span className="truncate">Admin (Ops)</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleTabClick('USER')}
                className={`py-2.5 px-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedRole === 'USER'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4 text-emerald-200" />
                <span className="truncate">Field User</span>
              </button>
            </div>
          </div>

          {/* Privilege explanation box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>
                {selectedRole === 'SUPER_ADMIN' && 'Super Admin Access Privileges'}
                {selectedRole === 'ADMIN' && 'Admin (Operations Lead) Access Privileges'}
                {selectedRole === 'USER' && 'Field Executive Access Privileges'}
              </span>
            </span>
            <div className="text-[11px] text-slate-600 leading-relaxed">
              {selectedRole === 'SUPER_ADMIN' && (
                <p>
                  Master authority: View all DPRs, set state monthly visit quotas, approve roadmaps, inspect target priorities, and audit system data.
                </p>
              )}
              {selectedRole === 'ADMIN' && (
                <div>
                  <p>
                    Territory authority: Review and approve team Daily Progress Reports, manage school priority queues, import Excel datasets, and export roadmaps to PDF/Word/Excel.
                  </p>
                  <span className="block mt-1 font-mono text-[10px] text-blue-700 bg-blue-100/60 p-1.5 rounded-lg border border-blue-200">
                    <strong>Admin Credentials:</strong> nattonskillxjunior@gmail.com • <strong>Password:</strong> nattonskillxjunior@123
                  </span>
                </div>
              )}
              {selectedRole === 'USER' && (
                <p>
                  Outreach authority: Submit Daily Progress Reports (DPR), view high-priority "Target First" schools, track daily/weekly/monthly targets, and check in on mobile.
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-hidden font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Authenticate & Enter {selectedRole.replace(/_/g, ' ')} Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Tap Quick Access buttons */}
          <div className="pt-2 border-t border-slate-100 text-center space-y-2">
            <span className="text-[11px] text-slate-400 font-semibold block">
              Or Click Below for Instant 1-Tap Login:
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('superadmin')}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-800 text-[11px] transition-colors cursor-pointer"
              >
                Log In as Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 rounded-lg font-bold text-blue-900 text-[11px] transition-colors cursor-pointer"
              >
                Log In as Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('user')}
                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg font-bold text-emerald-900 text-[11px] transition-colors cursor-pointer"
              >
                Log In as Field User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
