import React, { useState } from 'react';
import { SchoolRecord, SchoolReview, UserSession } from '../types/school';
import { store } from '../services/store';
import { Star, CheckCircle2, UserCheck, ShieldCheck, User } from 'lucide-react';
import { extractAreaFromSchool } from '../utils/areaExtractor';

interface ReviewsViewProps {
  schools: SchoolRecord[];
  reviews: SchoolReview[];
  session: UserSession | null;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({ schools, reviews, session }) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || '');
  const [personMet, setPersonMet] = useState<string>('Principal');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [labVerified, setLabVerified] = useState<boolean>(true);
  const [success, setSuccess] = useState<string>('');

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;

    const personMetVal = personMet.trim() || 'Principal / School In-Charge';

    store.addReview({
      schoolId: selectedSchool.id,
      schoolName: selectedSchool.name,
      reviewerName: session?.name || 'Field Officer',
      reviewerRole: session?.designation || 'Field Outreach Executive',
      personMet: personMetVal,
      rating,
      comment: comment || 'Verified campus facilities and computer laboratory.',
      computerLabVerified: labVerified,
    });

    setSuccess(`Review & Person Met saved for ${selectedSchool.name}! Dynamically stored in DPR Reports under "keyPersonMet".`);
    setTimeout(() => setSuccess(''), 4500);
    setComment('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
            <UserCheck className="w-4 h-4 text-amber-600" />
            <span>Field Observations & Official Visit Audits</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            School Reviews & Person Met Logs
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Audit logs from field representatives evaluating on-site campus visits. Person Met entries automatically and dynamically sync with Daily Progress Reports (DPR).
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-xl text-slate-700">
          {reviews.length} Verified Reviews
        </span>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 font-bold text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Review Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-base font-black text-slate-900">Add Visit Review & Person Met Log</h2>
            <p className="text-xs text-slate-500">
              Person Met will be dynamically saved to this school's DPR Report
            </p>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
            {/* School Selector */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Select Target School *</label>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({extractAreaFromSchool(s.name, s.area, s.city)})
                  </option>
                ))}
              </select>
            </div>

            {/* Person Met (Renamed from Infrastructure) */}
            <div className="space-y-1.5 p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
              <label className="font-bold text-blue-950 block text-xs flex items-center justify-between">
                <span>Person Met (School Representative) *</span>
                <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  DPR Synced
                </span>
              </label>
              <input
                type="text"
                value={personMet}
                onChange={(e) => setPersonMet(e.target.value)}
                placeholder="e.g. Dr. S. R. Patil (Principal) or Headmaster"
                className="w-full p-2.5 bg-white border border-blue-300 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Principal', 'Headmaster', 'Vice Principal', 'IT / Lab Teacher', 'Trustee / Admin'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setPersonMet(role)}
                    className="text-[10px] px-2 py-0.5 bg-white hover:bg-blue-100 text-blue-800 font-bold rounded-lg border border-blue-200 cursor-pointer transition-colors"
                  >
                    + {role}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-blue-700 font-medium pt-0.5">
                Saved into the official Daily Progress Report (<span className="font-mono font-bold">keyPersonMet</span>)
              </p>
            </div>

            {/* Visit Experience Rating */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Visit Experience Rating (1-5)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-600 ml-2">{rating} / 5 Stars</span>
              </div>
            </div>

            {/* Computer Lab Verified Checkbox */}
            <div className="p-3 bg-slate-50 border rounded-2xl">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={labVerified}
                  onChange={(e) => setLabVerified(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Computer Lab was physically inspected during this visit</span>
              </label>
            </div>

            {/* Feedback / Review Notes */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Review Feedback & Meeting Minutes</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Discussed curriculum partnership, met IT teacher, confirmed 25 functional computers with broadband..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Post Field Review & Sync to DPR
            </button>
          </form>
        </div>

        {/* Reviews Feed */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
            Published Field Reviews & Person Met Logs
          </h2>

          <div className="space-y-3 overflow-y-auto max-h-[600px]">
            {reviews.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No reviews logged yet. Submit a review above to record who was met and dynamically sync to DPR.
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl border bg-slate-50/50 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">{rev.schoolName}</h3>
                      <p className="text-[11px] text-slate-500">
                        Reviewed by {rev.reviewerName} ({rev.reviewerRole})
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Person Met Badge */}
                  <div className="flex items-center justify-between gap-2 bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-200 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-blue-950">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Person Met: {rev.personMet || 'Principal'}</span>
                    </div>
                    <span className="text-[10px] text-emerald-800 font-mono bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 font-bold shrink-0">
                      ✓ DPR Synced (keyPersonMet)
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                    "{rev.comment}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="text-emerald-700 font-bold">
                      {rev.computerLabVerified ? '✓ Computer Lab Checked' : 'General Campus Review'}
                    </span>
                    <span>{new Date(rev.reviewedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
