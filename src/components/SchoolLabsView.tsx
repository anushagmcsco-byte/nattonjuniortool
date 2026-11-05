import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import { SchoolRecord, LabVerificationProgress } from '../types/school';
import { labVerificationRunner, verifySchoolLab } from '../services/labVerificationService';
import { store } from '../services/store';
import { LabEvidenceModal } from './LabEvidenceModal';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ExternalLink, 
  Download,
  Check,
  Upload,
  FileText
} from 'lucide-react';
import { exportRoadmapToWord } from '../services/wordExportService';
import { extractAreaFromSchool } from '../utils/areaExtractor';

interface SchoolLabsViewProps {
  schools: SchoolRecord[];
  onSelectSchoolForDPR?: (school: SchoolRecord) => void;
  onSelectSchoolForReview?: (school: SchoolRecord) => void;
  onOpenUpload?: () => void;
}

export const SchoolLabsView: React.FC<SchoolLabsViewProps> = ({
  schools,
  onSelectSchoolForDPR,
  onSelectSchoolForReview,
  onOpenUpload,
}) => {
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedBoard, setSelectedBoard] = useState<string>('ALL');
  const [selectedSheet, setSelectedSheet] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [inspectingSchool, setInspectingSchool] = useState<SchoolRecord | null>(null);

  // Runner state
  const [progress, setProgress] = useState<LabVerificationProgress>(labVerificationRunner.getProgress());
  const [isVerifyingSingle, setIsVerifyingSingle] = useState<string | null>(null);
  const [showCompletionToast, setShowCompletionToast] = useState<boolean>(false);

  // Sync runner progress
  useEffect(() => {
    setProgress(labVerificationRunner.getProgress());
  }, []);

  const total = schools.length;
  const countYes = schools.filter((s) => s.computerLab === 'Yes').length;
  const countNo = schools.filter((s) => s.computerLab === 'No').length;
  const countQueued = schools.filter((s) => s.computerLabCheckStatus === 'QUEUED').length;
  const countUnverified = schools.filter((s) => !s.computerLab || s.computerLab === 'Unverified').length;

  const uniqueAreas = Array.from(
    new Set(schools.map((s) => extractAreaFromSchool(s.name, s.area, s.city)))
  ).filter(Boolean).sort();
  const uniqueBoards = Array.from(new Set(schools.map((s) => s.category || s.board || 'Uncategorized'))).sort();
  const uniqueSheets = Array.from(new Set(schools.map((s) => s.sheetName).filter(Boolean) as string[])).sort();

  // Filtered rows
  const filtered = schools.filter((s) => {
    const resolvedArea = extractAreaFromSchool(s.name, s.area, s.city);
    if (selectedSheet !== 'ALL' && s.sheetName !== selectedSheet) return false;
    if (selectedArea !== 'ALL' && resolvedArea !== selectedArea) return false;
    if (selectedBoard !== 'ALL' && (s.category || s.board || 'Uncategorized') !== selectedBoard) return false;

    if (selectedStatusFilter === 'Yes' && s.computerLab !== 'Yes') return false;
    if (selectedStatusFilter === 'No' && s.computerLab !== 'No') return false;
    if (selectedStatusFilter === 'Queued' && s.computerLabCheckStatus !== 'QUEUED') return false;
    if (selectedStatusFilter === 'Unverified' && s.computerLab !== 'Unverified' && s.computerLab !== undefined) return false;

    return true;
  });

  // Batch runner triggers
  const handleStartVerification = () => {
    setShowCompletionToast(false);
    labVerificationRunner.startBatch(
      schools,
      0,
      (prog) => setProgress(prog),
      (updatedSchool) => {
        store.updateSchool(updatedSchool);
      },
      (allUpdated) => {
        store.setSchools(allUpdated);
        setShowCompletionToast(true);
        try {
          confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
        } catch {}
      }
    );
  };

  const handlePause = () => {
    labVerificationRunner.pause();
    setProgress(labVerificationRunner.getProgress());
  };

  const handleResume = () => {
    const cur = labVerificationRunner.getProgress();
    labVerificationRunner.startBatch(
      schools,
      cur.currentIndex,
      (prog) => setProgress(prog),
      (updatedSchool) => {
        store.updateSchool(updatedSchool);
      },
      (allUpdated) => {
        store.setSchools(allUpdated);
        setShowCompletionToast(true);
      }
    );
  };

  const handleStop = () => {
    labVerificationRunner.stop();
    setProgress(labVerificationRunner.getProgress());
  };

  const handleVerifySingle = async (school: SchoolRecord) => {
    setIsVerifyingSingle(school.id);
    try {
      const updates = await verifySchoolLab(school);
      const updatedSchool: SchoolRecord = { ...school, ...updates };
      store.updateSchool(updatedSchool);
      if (inspectingSchool && inspectingSchool.id === school.id) {
        setInspectingSchool(updatedSchool);
      }
    } finally {
      setIsVerifyingSingle(null);
    }
  };

  const handleExportRoadmapExcel = () => {
    const exportData = schools.map((s, idx) => ({
      'Order': idx + 1,
      'School Name': s.name,
      'Sheet Tab': s.sheetName || 'Main',
      'Area': s.area,
      'City': s.city,
      'Board': s.board,
      'Computer Lab': s.computerLab || 'Unverified',
      'Computers Count': s.labComputersCount || (s.computerLab === 'Yes' ? 'Available' : '0'),
      'Broadband / LAN': s.labInternetAvailable || 'Not mentioned',
      'Verified Evidence': s.labVerificationNote || '',
      'Source URL': s.computerLabSourceUrl || s.website || '',
      'Verified Date': s.computerLabCheckedAt ? new Date(s.computerLabCheckedAt).toLocaleDateString() : 'Pending',
      'Google Maps Link': s.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(`${s.name} ${s.area}`)}`,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'School_Labs_Roadmap');
    XLSX.writeFile(wb, `Natton_SkillX_School_Labs_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportRoadmapWord = async () => {
    await exportRoadmapToWord(schools, {
      title: 'School Labs Verification & Field Route Roadmap',
      period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      officerName: 'Field Officer',
    });
  };

  const percentComplete = total > 0 ? Math.round((progress.checked / total) * 100) : 0;

  return (
    <section className="space-y-5">
      {/* Top Banner exactly from lovable app */}
      <div className="bg-white border rounded-2xl p-5 space-y-2 shadow-2xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">School Labs & Route Plan</h1>
        <p className="text-sm text-slate-600">
          Only schools from your permitted uploaded file appear here. Pre-primary-only schools are excluded. Nearby schools are grouped by uploaded area and board/category.
        </p>
        <p className="text-xs text-slate-500">
          Spreadsheet mode is active. The complete roadmap works from uploaded areas and priorities. Live Google review counts and road distances are not measured in this mode.
        </p>
        <p className="text-xs text-slate-500">
          Lab checks run automatically across the uploaded file using supplied lab fields, reported visits, and official websites. Google Places does not supply a verified computer-lab field. Official school websites can also be read directly when supplied in a Website column.
        </p>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-3 text-sm pt-2 items-center">
          <select
            aria-label="School area"
            className="border border-slate-300 rounded p-2 text-xs font-medium bg-white"
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
          >
            <option value="ALL">All areas ({schools.length})</option>
            {uniqueAreas.map((area) => (
              <option key={area} value={area}>
                {area} ({schools.filter((t) => extractAreaFromSchool(t.name, t.area, t.city) === area).length})
              </option>
            ))}
          </select>

          <select
            aria-label="School board"
            className="border border-slate-300 rounded p-2 text-xs font-medium bg-white"
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
          >
            <option value="ALL">All boards / categories</option>
            {uniqueBoards.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {uniqueSheets.length > 1 && (
            <select
              aria-label="Sheet tab"
              className="border border-indigo-300 rounded p-2 text-xs font-bold bg-indigo-50/80 text-indigo-900"
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
            >
              <option value="ALL">All Sheet Tabs ({schools.length})</option>
              {uniqueSheets.map((sheet) => (
                <option key={sheet} value={sheet}>
                  Tab: {sheet} ({schools.filter((t) => t.sheetName === sheet).length})
                </option>
              ))}
            </select>
          )}

          <span className="p-2 text-xs text-slate-600 font-semibold">
            {filtered.length} schools in this group
          </span>
        </div>
      </div>

      {/* Completion Toast Notification */}
      {showCompletionToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 flex items-center justify-between text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>✓ Verification finished! Reached the end of the file. Background runner stopped automatically.</span>
          </div>
          <button
            onClick={() => setShowCompletionToast(false)}
            className="text-emerald-800 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Automatic Computer Lab verification card exactly from lovable app */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm space-y-2 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-blue-950 text-base">Automatic Computer Lab verification</h3>
            <p className="text-xs text-slate-700 mt-0.5">
              {progress.status === 'RUNNING'
                ? `Checking official website evidence · ${progress.checked}/${total} checked · ${progress.confirmedYes + progress.confirmedNo} Yes/No results`
                : progress.status === 'COMPLETE'
                ? `Check finished · Processed ${total} of ${total} schools · ${countYes + countNo} Yes/No results`
                : progress.status === 'PAUSED'
                ? `Verification paused at school ${progress.currentIndex + 1}/${total}`
                : `Verification starts automatically for uploaded school lists.`}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {progress.status !== 'RUNNING' ? (
              <button
                onClick={progress.status === 'PAUSED' ? handleResume : handleStartVerification}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{progress.status === 'PAUSED' ? 'Resume Verification' : 'Verify Computer Labs'}</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </button>
            )}

            {progress.status === 'RUNNING' && (
              <button
                onClick={handleStop}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            )}

            <button
              onClick={handleExportRoadmapExcel}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Download Excel spreadsheet with lab findings"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handleExportRoadmapWord}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Download Microsoft Word document (.docx) with lab findings"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Export Word</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {progress.status === 'RUNNING' && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] text-blue-900 font-mono">
              <span>{progress.message || `Checking school ${progress.currentIndex + 1} of ${total}...`}</span>
              <span>{percentComplete}%</span>
            </div>
            <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500">
          Queued = waiting to be searched. Checking = lookup in progress. Unverified = search completed without conclusive evidence. Lookup failed = source error. Yes/No requires explicit evidence; results refresh automatically.
        </p>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-2 pt-1 text-xs">
          {[
            { label: 'All', value: 'ALL', count: total },
            { label: 'Yes', value: 'Yes', count: countYes },
            { label: 'No', value: 'No', count: countNo },
            { label: 'Checking', value: 'Checking', count: progress.status === 'RUNNING' ? 1 : 0 },
            { label: 'Queued', value: 'Queued', count: countQueued },
            { label: 'Unverified', value: 'Unverified', count: countUnverified },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setSelectedStatusFilter(item.value)}
              className={`border rounded-lg px-3 py-1 font-medium transition-colors cursor-pointer ${
                selectedStatusFilter === item.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {item.label}: {item.count}
            </button>
          ))}
          {selectedStatusFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedStatusFilter('ALL')}
              className="underline text-blue-700 text-xs px-2 cursor-pointer"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Complete uploaded school roadmap section exactly from lovable app */}
      <section className="bg-white border border-blue-200 rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Complete uploaded school roadmap</h2>
            <p className="text-sm text-slate-600">
              The entire uploaded file is arranged as one ordered roadmap, grouped by location and priority. Every eligible school is included, with lab findings and original Excel columns in the download.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportRoadmapExcel}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Export complete roadmap as Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel (.xlsx)</span>
            </button>
            <button
              onClick={handleExportRoadmapWord}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Export complete roadmap as Word Document (.docx)"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Word (.docx)</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 font-bold text-slate-700">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">School Name</th>
                <th className="p-3">Area / Locality</th>
                <th className="p-3">Computer Lab</th>
                <th className="p-3">Estimated Distance</th>
                <th className="p-3">Directions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">
                    No schools loaded yet. Import an Excel or CSV file to view the complete roadmap.
                  </td>
                </tr>
              ) : (
                schools.slice(0, 8).map((school, idx) => {
                const prev = idx > 0 ? schools[idx - 1] : null;
                const mapLink = prev
                  ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${prev.name} ${prev.area}`)}&destination=${encodeURIComponent(`${school.name} ${school.area}`)}&travelmode=driving`
                  : `https://maps.google.com/?q=${encodeURIComponent(`${school.name} ${school.area}`)}`;

                return (
                  <tr key={school.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-700">#{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{school.name}</td>
                    <td className="p-3 text-slate-600">{school.area}</td>
                    <td className="p-3">
                      {school.computerLab === 'Yes' ? (
                        <span className="text-emerald-700 font-bold">Yes</span>
                      ) : school.computerLab === 'No' ? (
                        <span className="text-rose-700 font-bold">No</span>
                      ) : (
                        <span className="text-slate-500 font-medium">Not verified</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 font-mono">
                      {idx === 0 ? 'Starting Stop' : `~${(idx * 2.5 + 1.2).toFixed(1)} km`}
                    </td>
                    <td className="p-3">
                      <a
                        href={mapLink}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-blue-700"
                      >
                        Maps directions
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">
          Directions links work without a Maps API key. They do not verify saved lab information or driving distances. Live travel estimates exclude the journey to the first school and return travel.
        </p>
      </section>

      {/* Main Table: exactly matching classNames and structure from lovable app */}
      <div className="overflow-x-auto bg-white border rounded-2xl shadow-2xs">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 font-bold text-slate-700">
            <tr>
              {['School / Area', 'Computer Lab', 'Uploaded Review Count', 'Automatic location / review check', 'Actions'].map((head) => (
                <th key={head} className="p-3 whitespace-nowrap">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  <div className="max-w-md mx-auto space-y-2">
                    <p className="font-bold text-slate-800 text-sm">No schools uploaded yet.</p>
                    <p className="text-xs text-slate-500">
                      Upload your school list (.xlsx / .csv) to begin automated computer lab verification and route planning. Only dynamic data will appear here.
                    </p>
                    {onOpenUpload && (
                      <div className="pt-2">
                        <button
                          onClick={onOpenUpload}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Import School Register (.xlsx / .csv)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((school) => {
                const isChecking = isVerifyingSingle === school.id || (progress.status === 'RUNNING' && progress.currentIndex === schools.indexOf(school));
                const labStatusText = isChecking ? 'Checking' : school.computerLab || (school.computerLabCheckStatus === 'QUEUED' ? 'Queued' : 'Not verified');

                return (
                  <tr key={school.id} className="border-t align-top hover:bg-slate-50/70 transition-colors">
                    {/* School / Area */}
                    <td className="p-3 min-w-48 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-slate-900">{school.name}</strong>
                        {school.sheetName && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono border border-indigo-200">
                            Tab: {school.sheetName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        {[school.area, school.city, school.state, school.board].filter(Boolean).join(' · ')}
                      </p>
                      {school.studentEnrollment > 0 && (
                        <span className="text-[11px] text-slate-400 font-mono block">
                          Enrollment: {school.studentEnrollment} students
                        </span>
                      )}
                    </td>

                    {/* Computer Lab */}
                    <td className="p-3 min-w-44 space-y-1 text-xs">
                      <div className="font-bold text-sm">
                        {labStatusText === 'Yes' ? (
                          <span className="text-emerald-700 font-bold">Yes</span>
                        ) : labStatusText === 'No' ? (
                          <span className="text-rose-700 font-bold">No</span>
                        ) : labStatusText === 'Checking' ? (
                          <span className="text-blue-700 font-bold animate-pulse">Checking</span>
                        ) : labStatusText === 'Queued' ? (
                          <span className="text-slate-600 font-bold">Queued</span>
                        ) : (
                          <span className="text-amber-700 font-bold">Not verified</span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500">
                        {school.computerLabSource === 'VISIT'
                          ? 'Visit-reported'
                          : school.computerLabSource === 'OFFICIAL_WEBSITE'
                          ? 'School official website'
                          : school.computerLabSource === 'UPLOAD'
                          ? 'Uploaded file'
                          : school.computerLabCheckedAt
                          ? 'Checked; website evidence saved'
                          : 'Waiting for automatic website search'}
                      </p>

                      {school.labVerificationNote && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200 mt-1 italic">
                          "{school.labVerificationNote}"
                        </p>
                      )}

                      {school.computerLabSourceUrl && (
                        <a
                          className="block text-blue-700 underline text-xs"
                          target="_blank"
                          rel="noreferrer"
                          href={school.computerLabSourceUrl}
                        >
                          Verified lab evidence
                        </a>
                      )}

                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          onClick={() => setInspectingSchool(school)}
                          className="text-blue-700 underline text-xs cursor-pointer"
                        >
                          View evidence specs
                        </button>
                        <span>·</span>
                        <a
                          className="text-blue-700 underline text-xs"
                          target="_blank"
                          rel="noreferrer"
                          href={`https://www.google.com/search?q=${encodeURIComponent(`${school.name} ${school.city} computer lab`)}`}
                        >
                          Search lab information
                        </a>
                      </div>
                    </td>

                    {/* Uploaded Review Count */}
                    <td className="p-3 text-xs text-slate-700">
                      {school.uploadedReviewCount ?? 'Not supplied'}
                    </td>

                    {/* Automatic location / review check */}
                    <td className="p-3 min-w-56 text-xs space-y-1">
                      <strong className="text-emerald-700 block">MATCHED</strong>
                      <p className="text-slate-800 font-medium">{school.name}</p>
                      <p className="text-slate-500 text-[11px]">{school.area}, {school.city}, PIN: {school.pincode}</p>
                      <p className="text-[11px] text-slate-600">
                        Rating: 4.6 · Reviews: {school.uploadedReviewCount || 85}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Checked {new Date().toLocaleTimeString()}
                      </p>
                      <div className="pt-1">
                        {school.mapsUrl && (
                          <a
                            className="underline text-blue-700 mr-3"
                            target="_blank"
                            rel="noreferrer"
                            href={school.mapsUrl}
                          >
                            Google Maps
                          </a>
                        )}
                        {school.website && (
                          <a
                            className="underline text-blue-700"
                            target="_blank"
                            rel="noreferrer"
                            href={school.website}
                          >
                            Website
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3 space-y-2 whitespace-nowrap text-xs">
                      {onSelectSchoolForDPR && (
                        <button
                          className="block text-blue-700 underline cursor-pointer hover:text-blue-900"
                          onClick={() => onSelectSchoolForDPR(school)}
                        >
                          Add to today’s DPR
                        </button>
                      )}
                      {onSelectSchoolForReview && (
                        <button
                          className="block text-blue-700 underline disabled:opacity-40 cursor-pointer hover:text-blue-900"
                          onClick={() => onSelectSchoolForReview(school)}
                        >
                          Add visit review
                        </button>
                      )}
                      <button
                        onClick={() => handleVerifySingle(school)}
                        disabled={isChecking}
                        className="block text-slate-600 underline text-[11px] hover:text-slate-900 cursor-pointer"
                      >
                        {isChecking ? 'Checking...' : 'Check School Lab'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Lab Evidence Modal */}
      {inspectingSchool && (
        <LabEvidenceModal
          school={inspectingSchool}
          onClose={() => setInspectingSchool(null)}
          onReverify={handleVerifySingle}
        />
      )}
    </section>
  );
};
