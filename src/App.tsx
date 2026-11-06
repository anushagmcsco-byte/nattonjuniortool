import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { SchoolRecord, UserSession } from './types/school';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { SchoolLabsView } from './components/SchoolLabsView';
import { PriorityTargetingView } from './components/PriorityTargetingView';
import { DprConsoleView } from './components/DprConsoleView';
import { RoadmapExportsView } from './components/RoadmapExportsView';
import { MobileAppView } from './components/MobileAppView';
import { ReviewsView } from './components/ReviewsView';
import { UploadModal } from './components/UploadModal';
import { EnvConfigModal } from './components/EnvConfigModal';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(store.getSession());
  const [currentTab, setCurrentTab] = useState<string>('SCHOOL_LABS');
  const [schools, setSchools] = useState<SchoolRecord[]>(store.getSchools());
  const [reports, setReports] = useState(store.getReports());
  const [reviews, setReviews] = useState(store.getReviews());

  // Modals
  const [uploadOpen, setUploadOpen] = useState<boolean>(false);
  const [guideOpen, setGuideOpen] = useState<boolean>(false);
  const [preselectedSchoolForDPR, setPreselectedSchoolForDPR] = useState<SchoolRecord | null>(null);

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setSession(store.getSession());
      setSchools(store.getSchools());
      setReports(store.getReports());
      setReviews(store.getReviews());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleSignOut = () => {
    store.setSession(null);
    setSession(null);
  };

  const handleSelectSchoolForDPR = (school: SchoolRecord) => {
    setPreselectedSchoolForDPR(school);
    setCurrentTab('DPR_CONSOLE');
  };

  const handleSelectSchoolForReview = (school: SchoolRecord) => {
    setCurrentTab('REVIEWS');
  };

  const handleUploadSuccess = (
    count: number,
    filename: string,
    importedRecords: SchoolRecord[],
    csvText: string,
    sheetNames?: string[]
  ) => {
    store.addUploadedFile(filename, importedRecords, csvText, sheetNames);
    setUploadOpen(false);
    setCurrentTab('SCHOOL_LABS');
  };

  // If user is not authenticated, render authentic Gateway Login Screen
  if (!session) {
    return <LoginScreen onLoginSuccess={(sess) => setSession(sess)} />;
  }

  return (
    <div className="brand-page min-h-screen flex flex-col text-slate-900 selection:bg-blue-600 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Brand Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        session={session}
        hasSchools={schools.length > 0}
        onOpenUpload={() => setUploadOpen(true)}
        onOpenGuide={() => setGuideOpen(true)}
        onSignOut={handleSignOut}
        onClearSchools={() => {
          if (confirm('Clear the current school register?')) {
            store.clearAllSchools();
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 min-w-0">
        {currentTab === 'SCHOOL_LABS' && (
          <SchoolLabsView
            schools={schools}
            onSelectSchoolForDPR={handleSelectSchoolForDPR}
            onSelectSchoolForReview={handleSelectSchoolForReview}
            onOpenUpload={() => setUploadOpen(true)}
          />
        )}

        {currentTab === 'PRIORITY_TARGETING' && (
          <PriorityTargetingView
            schools={schools}
            session={session}
            onSelectForDPR={handleSelectSchoolForDPR}
            onSelectForLabCheck={() => setCurrentTab('SCHOOL_LABS')}
          />
        )}

        {currentTab === 'DPR_CONSOLE' && (
          <DprConsoleView
            schools={schools}
            reports={reports}
            session={session}
            preselectedSchool={preselectedSchoolForDPR}
            onClearPreselected={() => setPreselectedSchoolForDPR(null)}
          />
        )}

        {currentTab === 'ROADMAP_EXPORTS' && (
          <RoadmapExportsView schools={schools} session={session} />
        )}

        {currentTab === 'MOBILE_APP' && (
          <MobileAppView schools={schools} session={session} />
        )}

        {(currentTab === 'REVIEWS' || currentTab === 'REVIEW_ADMIN') && (
          <ReviewsView schools={schools} reviews={reviews} session={session} />
        )}
      </main>

      {/* Footer matching brand */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white/60 py-4 px-6 text-center text-xs text-slate-500">
        <p className="font-medium">
          NATTONSKILLXJUNIOR • Daily Progress Reports (DPR), Computer Lab Verification & School Priority Targeting Engine
        </p>
      </footer>

      {/* Upload Modal */}
      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Setup Guide Modal */}
      {guideOpen && <EnvConfigModal onClose={() => setGuideOpen(false)} />}
    </div>
  );
}
