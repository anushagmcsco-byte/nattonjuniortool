import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { SchoolRecord, PriorityLevel, UserSession } from '../types/school';
import { Target, Search, Download, Filter, MapPin, Calendar, Clock, ArrowUpDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { extractAreaFromSchool } from '../utils/areaExtractor';

interface PriorityTargetingViewProps {
  schools: SchoolRecord[];
  session: UserSession | null;
  onSelectForDPR: (school: SchoolRecord) => void;
  onSelectForLabCheck: (school: SchoolRecord) => void;
}

export const PriorityTargetingView: React.FC<PriorityTargetingViewProps> = ({
  schools,
  session,
  onSelectForDPR,
  onSelectForLabCheck,
}) => {
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedBoard, setSelectedBoard] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('TABLE');

  // Tallies
  const p1Count = schools.filter((s) => s.priorityLevel === 'P1_CRITICAL').length;
  const p2Count = schools.filter((s) => s.priorityLevel === 'P2_HIGH').length;
  const p3Count = schools.filter((s) => s.priorityLevel === 'P3_MEDIUM').length;
  const p4Count = schools.filter((s) => s.priorityLevel === 'P4_LOW').length;

  const filtered = schools.filter((s) => {
    if (selectedPriority !== 'ALL' && s.priorityLevel !== selectedPriority) return false;
    if (selectedBoard !== 'ALL' && s.board !== selectedBoard) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const resolvedArea = extractAreaFromSchool(s.name, s.area, s.city).toLowerCase();
      const matchArea = resolvedArea.includes(q) || s.area.toLowerCase().includes(q);
      const matchReason = s.targetPriorityReason.toLowerCase().includes(q);
      if (!matchName && !matchArea && !matchReason) return false;
    }
    return true;
  }).sort((a, b) => b.priorityScore - a.priorityScore || b.daysSinceLastVisit - a.daysSinceLastVisit);

  const getPriorityStyle = (level: PriorityLevel) => {
    switch (level) {
      case 'P1_CRITICAL':
        return {
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          dot: 'bg-rose-500',
          text: 'P1 Critical',
          action: 'Immediate Visit Needed',
        };
      case 'P2_HIGH':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          text: 'P2 High Priority',
          action: 'Priority Outreach',
        };
      case 'P3_MEDIUM':
        return {
          badge: 'bg-blue-100 text-blue-800 border-blue-300',
          dot: 'bg-blue-500',
          text: 'P3 Medium Priority',
          action: 'Scheduled Check-in',
        };
      default:
        return {
          badge: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
          text: 'P4 Low (Recent)',
          action: 'Regular Follow-up',
        };
    }
  };

  const handleExport = () => {
    const data = filtered.map((s, i) => ({
      'Rank': i + 1,
      'School Name': s.name,
      'UDISE Code': s.code,
      'Priority Level': s.priorityLevel,
      'Priority Score': s.priorityScore,
      'Reason': s.targetPriorityReason,
      'Area': s.area,
      'City': s.city,
      'Board': s.board,
      'Enrollment': s.studentEnrollment,
      'Days Since Last Visit': s.daysSinceLastVisit,
      'Computer Lab Status': s.computerLab || 'Unverified',
      'Assigned Officer': s.assignedOfficerName || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Priority_Targeting');
    XLSX.writeFile(wb, `Natton_SkillX_Priority_Targets_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
            <Target className="w-4 h-4 text-rose-600" />
            <span>Targeting Recommendation Engine</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            School Priority Targeting & Visit Ranking
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Ranked based on days since last field visit, student enrollment scale, computer lab verification status, and strategic partnership targets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Targets (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Priority Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setSelectedPriority(selectedPriority === 'P1_CRITICAL' ? 'ALL' : 'P1_CRITICAL')}
          className={`p-4 rounded-3xl border transition-all cursor-pointer ${
            selectedPriority === 'P1_CRITICAL'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-rose-700">
            <span>Target First • P1</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-rose-950 mt-1">{p1Count}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Critical overdue visits (&gt;60 days)</p>
        </div>

        <div
          onClick={() => setSelectedPriority(selectedPriority === 'P2_HIGH' ? 'ALL' : 'P2_HIGH')}
          className={`p-4 rounded-3xl border transition-all cursor-pointer ${
            selectedPriority === 'P2_HIGH'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-700">
            <span>P2 High Priority</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-950 mt-1">{p2Count}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Active engagement pipeline</p>
        </div>

        <div
          onClick={() => setSelectedPriority(selectedPriority === 'P3_MEDIUM' ? 'ALL' : 'P3_MEDIUM')}
          className={`p-4 rounded-3xl border transition-all cursor-pointer ${
            selectedPriority === 'P3_MEDIUM'
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-blue-700">
            <span>P3 Medium</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-950 mt-1">{p3Count}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Regular check-ins (15–40 days)</p>
        </div>

        <div
          onClick={() => setSelectedPriority(selectedPriority === 'P4_LOW' ? 'ALL' : 'P4_LOW')}
          className={`p-4 rounded-3xl border transition-all cursor-pointer ${
            selectedPriority === 'P4_LOW'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>P4 Low / Recent</span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{p4Count}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Recently visited (&lt;14 days)</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search targets by school name, area, or reason..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Priority Levels</option>
            <option value="P1_CRITICAL">P1 Critical Only</option>
            <option value="P2_HIGH">P2 High Only</option>
            <option value="P3_MEDIUM">P3 Medium Only</option>
            <option value="P4_LOW">P4 Low Only</option>
          </select>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                viewMode === 'CARDS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Cards View
            </button>
          </div>
        </div>
      </div>

      {/* Target Content */}
      {viewMode === 'TABLE' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5 pl-5">Priority & Rank</th>
                  <th className="p-3.5">School Details</th>
                  <th className="p-3.5">Visit Age & Score</th>
                  <th className="p-3.5">Targeting Rationale</th>
                  <th className="p-3.5">Computer Lab</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No target schools in the register. Upload an Excel or CSV file to prioritize campuses.
                    </td>
                  </tr>
                ) : (
                  filtered.map((school, idx) => {
                    const style = getPriorityStyle(school.priorityLevel);

                  return (
                    <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[10px] border ${style.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            <span>{style.text}</span>
                          </span>
                          <div className="text-[10px] font-mono font-bold text-slate-400">
                            Rank #{idx + 1}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 min-w-[200px]">
                        <div className="font-black text-slate-900 text-sm">{school.name}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {extractAreaFromSchool(school.name, school.area, school.city)} · {school.city} · {school.board}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="font-bold text-slate-900">
                            Score: {school.priorityScore} / 100
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            Last visit: {school.daysSinceLastVisit} days ago
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 max-w-sm text-[11px] text-slate-600">
                        <p className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          {school.targetPriorityReason}
                        </p>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        {school.computerLab === 'Yes' ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Lab Present</span>
                          </span>
                        ) : school.computerLab === 'No' ? (
                          <span className="text-rose-700 font-bold">No Lab</span>
                        ) : (
                          <span className="text-amber-700 font-medium">Unverified</span>
                        )}
                      </td>

                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectForDPR(school)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-xl shadow-2xs transition-colors"
                          >
                            Plan DPR Visit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
          No target schools in the register. Upload an Excel or CSV file to prioritize campuses.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((school, idx) => {
            const style = getPriorityStyle(school.priorityLevel);

            return (
              <div
                key={school.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[10px] border ${style.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      <span>{style.text}</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      Score: {school.priorityScore}
                    </span>
                  </div>

                  <h3 className="font-black text-slate-900 text-sm leading-snug">
                    {school.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {school.area} · {school.city} · {school.board}
                  </p>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {school.targetPriorityReason}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400">
                    Last check: {school.daysSinceLastVisit}d ago
                  </div>
                  <button
                    onClick={() => onSelectForDPR(school)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors"
                  >
                    Plan Visit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
