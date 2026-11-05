import { SchoolRecord, UserSession, DPRReport, SchoolReview, UploadHistoryItem } from '../types/school';
import { DEMO_ACCOUNTS } from '../data/sampleSchools';

const STORAGE_KEYS = {
  SESSION: 'nx_dpr_session',
  SCHOOLS: 'nx_dpr_schools',
  REPORTS: 'nx_dpr_reports',
  REVIEWS: 'nx_school_reviews',
  UPLOADS: 'nx_upload_history',
  ACTIVE_UPLOAD_ID: 'nx_active_upload_id',
};

class AppStore {
  private session: UserSession | null = null;
  private schools: SchoolRecord[] = [];
  private reports: DPRReport[] = [];
  private reviews: SchoolReview[] = [];
  private uploads: UploadHistoryItem[] = [];
  private activeUploadId: string | null = null;
  private listeners: Set<() => void> = new Set();
  private syncTimeout: any = null;
  private isLoadedFromBackend: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    try {
      // 1. Session (default to Super Admin for immediate access)
      const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (savedSession) {
        this.session = JSON.parse(savedSession);
      } else {
        this.session = DEMO_ACCOUNTS.superadmin;
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(this.session));
      }

      // 2. Schools: Load initially from localStorage for instantaneous first paint
      const savedSchools = localStorage.getItem(STORAGE_KEYS.SCHOOLS);
      if (savedSchools) {
        try {
          const parsed: SchoolRecord[] = JSON.parse(savedSchools);
          // Keep uploaded and dynamic records (only filter out legacy sample placeholder dummy IDs)
          this.schools = parsed.filter((s) => !s.id.startsWith('sch-00') && !s.id.startsWith('sch-01'));
        } catch (e) {
          console.warn('Error parsing saved schools:', e);
          this.schools = [];
        }
      } else {
        this.schools = [];
      }

      // 3. DPR Reports
      const savedReports = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (savedReports) {
        try {
          const parsedRep: DPRReport[] = JSON.parse(savedReports);
          this.reports = parsedRep.filter((r) => !r.id.startsWith('dpr-rep-001'));
        } catch (e) {
          this.reports = [];
        }
      } else {
        this.reports = [];
      }

      // 4. Reviews
      const savedReviews = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (savedReviews) {
        try {
          const parsedRev: SchoolReview[] = JSON.parse(savedReviews);
          this.reviews = parsedRev.filter((r) => !r.id.startsWith('rev-001') && !r.id.startsWith('rev-002'));
        } catch (e) {
          this.reviews = [];
        }
      } else {
        this.reviews = [];
      }

      // 5. Upload History
      const savedUploads = localStorage.getItem(STORAGE_KEYS.UPLOADS);
      if (savedUploads) {
        try {
          const parsedUp: UploadHistoryItem[] = JSON.parse(savedUploads);
          this.uploads = parsedUp.filter((u) => u.id !== 'upload-default-bengaluru');
        } catch (e) {
          this.uploads = [];
        }
      } else {
        this.uploads = [];
      }

      const savedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_UPLOAD_ID);
      this.activeUploadId = savedActiveId && savedActiveId !== 'upload-default-bengaluru' ? savedActiveId : null;
    } catch (e) {
      console.warn('Could not initialize local storage store:', e);
      this.schools = [];
      this.reports = [];
      this.reviews = [];
      this.uploads = [];
    }

    // 6. Connect to Backend Persistent Database immediately
    this.fetchFromBackend();

    // Re-sync when tab regains focus or network reconnects
    window.addEventListener('focus', () => {
      this.fetchFromBackend();
    });
    window.addEventListener('online', () => {
      this.fetchFromBackend();
    });
  }

  // Fetch full state from backend database API for permanent persistence across reloads/browsers
  public async fetchFromBackend(): Promise<void> {
    try {
      const res = await fetch('/api/store');
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.success && json.data) {
        const { schools, reports, reviews, uploads, activeUploadId } = json.data;
        let hasChanges = false;

        // If backend has schools, backend is the source of truth!
        if (Array.isArray(schools) && schools.length > 0) {
          this.schools = schools;
          if (Array.isArray(reports)) this.reports = reports;
          if (Array.isArray(reviews)) this.reviews = reviews;
          if (Array.isArray(uploads)) this.uploads = uploads;
          if (activeUploadId !== undefined) this.activeUploadId = activeUploadId;
          this.saveToLocalStorage();
          hasChanges = true;
        } else if (this.schools.length > 0) {
          // If server was fresh or restarted but client had local uploaded data, push client data to server!
          this.syncToBackend();
        }

        this.isLoadedFromBackend = true;
        if (hasChanges) {
          this.notify();
        }
      }
    } catch (err) {
      console.warn('Backend store fetch error (using local storage fallback):', err);
    }
  }

  // Persist to backend database API
  public syncToBackend(): void {
    if (typeof window === 'undefined') return;

    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(async () => {
      try {
        await fetch('/api/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schools: this.schools,
            reports: this.reports,
            reviews: this.reviews,
            uploads: this.uploads.map((u) => ({
              ...u,
              // Strip massive CSV strings over 200KB from upload items to keep payload snappy
              csvText: u.csvText && u.csvText.length > 200000 ? u.csvText.slice(0, 200000) + '...' : u.csvText,
            })),
            activeUploadId: this.activeUploadId,
          }),
        });
      } catch (err) {
        console.warn('Failed to sync data to backend database:', err);
      }
    }, 250);
  }

  // Safe local storage persistence with quota fallback protection
  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(this.schools));
    } catch (e) {
      console.warn('Quota exceeded while saving schools to localStorage:', e);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(this.reports));
    } catch (e) {
      console.warn('Quota exceeded while saving reports to localStorage:', e);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(this.reviews));
    } catch (e) {
      console.warn('Quota exceeded while saving reviews to localStorage:', e);
    }

    try {
      // Store compact uploads in localStorage so quota is never exceeded
      const compactUploads = this.uploads.map((u) => ({
        ...u,
        records: u.records.slice(0, 50), // keep sample preview records
        csvText: undefined, // skip large CSV text in localStorage
      }));
      localStorage.setItem(STORAGE_KEYS.UPLOADS, JSON.stringify(compactUploads));
      if (this.activeUploadId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_UPLOAD_ID, this.activeUploadId);
      }
    } catch (e) {
      console.warn('Quota exceeded while saving uploads to localStorage:', e);
    }
  }

  public subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // Session
  public getSession(): UserSession | null {
    return this.session;
  }

  public setSession(session: UserSession | null) {
    this.session = session;
    if (session) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
    this.notify();
  }

  public switchUser(userKey: 'superadmin' | 'admin' | 'user' | 'user2') {
    if (DEMO_ACCOUNTS[userKey]) {
      this.setSession(DEMO_ACCOUNTS[userKey]);
    }
  }

  // Schools
  public getSchools(): SchoolRecord[] {
    return this.schools;
  }

  public setSchools(newSchools: SchoolRecord[]) {
    this.schools = [...newSchools];
    this.saveToLocalStorage();
    this.syncToBackend();
    this.notify();
  }

  public updateSchool(updated: SchoolRecord) {
    const idx = this.schools.findIndex((s) => s.id === updated.id);
    if (idx !== -1) {
      this.schools[idx] = updated;
      this.saveToLocalStorage();
      this.syncToBackend();
      this.notify();
    }
  }

  public clearAllSchools() {
    this.schools = [];
    this.uploads = [];
    this.activeUploadId = null;

    try {
      localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.UPLOADS, JSON.stringify([]));
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_UPLOAD_ID);
    } catch (e) {
      console.error('Error clearing schools in localStorage:', e);
    }

    try {
      fetch('/api/store/clear', { method: 'POST' }).catch((err) => {
        console.warn('Backend clear failed:', err);
      });
    } catch (e) {}

    this.notify();
  }

  public addUploadedFile(filename: string, importedRecords: SchoolRecord[], csvText?: string, sheetNames?: string[]) {
    const newUpload: UploadHistoryItem = {
      id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      filename,
      uploadedAt: new Date().toISOString(),
      recordsCount: importedRecords.length,
      records: importedRecords,
      csvText,
      sheetNames: sheetNames || [],
      ownerId: this.session?.id || 'usr-super-01',
      ownerName: this.session?.name || 'Administrator',
      canVisit: true,
      canShare: true,
    };

    this.uploads.unshift(newUpload);
    this.activeUploadId = newUpload.id;
    this.schools = [...importedRecords];

    this.saveToLocalStorage();
    this.syncToBackend();
    this.notify();
    return newUpload;
  }

  public getUploadHistory(): UploadHistoryItem[] {
    return this.uploads;
  }

  public restoreUpload(uploadId: string) {
    const target = this.uploads.find((u) => u.id === uploadId);
    if (target) {
      this.schools = [...target.records];
      this.activeUploadId = target.id;
      this.saveToLocalStorage();
      this.syncToBackend();
      this.notify();
    }
  }

  // DPR Reports
  public getReports(): DPRReport[] {
    return this.reports;
  }

  public addReport(reportData: Omit<DPRReport, 'id' | 'createdAt'>): DPRReport {
    const newReport: DPRReport = {
      ...reportData,
      id: `dpr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.reports.unshift(newReport);

    const school = this.schools.find((s) => s.id === reportData.schoolId);
    if (school) {
      school.lastVisitedDate = reportData.visitDate;
      school.totalVisitsCount = (school.totalVisitsCount || 0) + 1;
      school.daysSinceLastVisit = 0;
      if (reportData.computerLabObserved === 'Yes') {
        school.computerLab = 'Yes';
        school.computerLabSource = 'VISIT';
        school.computerLabCheckedAt = new Date().toISOString();
        if (reportData.computersCountObserved) {
          school.labComputersCount = reportData.computersCountObserved;
        }
        school.labInternetAvailable = reportData.internetWorking ? 'Yes (Verified in Field Visit)' : 'No';
        school.labVerificationNote = `Verified in field visit by ${reportData.officerName} on ${reportData.visitDate}.`;
      } else if (reportData.computerLabObserved === 'No') {
        school.computerLab = 'No';
        school.computerLabSource = 'VISIT';
        school.computerLabCheckedAt = new Date().toISOString();
        school.labComputersCount = 0;
        school.labVerificationNote = `Field officer confirmed absence of computer lab during visit on ${reportData.visitDate}.`;
      }
      this.updateSchool(school);
    }

    this.saveToLocalStorage();
    this.syncToBackend();
    this.notify();
    return newReport;
  }

  public updateReportStatus(reportId: string, status: 'APPROVED_BY_ADMIN' | 'REVISION_REQUESTED', remarks?: string) {
    const rep = this.reports.find((r) => r.id === reportId);
    if (rep) {
      rep.approvalStatus = status;
      if (remarks) rep.adminRemarks = remarks;
      this.saveToLocalStorage();
      this.syncToBackend();
      this.notify();
    }
  }

  // Reviews
  public getReviews(): SchoolReview[] {
    return this.reviews;
  }

  public addReview(reviewData: Omit<SchoolReview, 'id' | 'reviewedAt'>) {
    const newRev: SchoolReview = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      reviewedAt: new Date().toISOString(),
    };
    this.reviews.unshift(newRev);

    // Dynamically store "Person Met" into the DPR Reports (keyPersonMet field)
    const school = this.schools.find((s) => s.id === reviewData.schoolId);
    const personMetVal = reviewData.personMet || 'Principal / School In-Charge';

    if (school && reviewData.personMet) {
      school.contactPerson = reviewData.personMet;
      school.lastVisitedDate = new Date().toISOString().slice(0, 10);
      school.totalVisitsCount = (school.totalVisitsCount || 0) + 1;
      this.updateSchool(school);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const existingReport = this.reports.find(
      (r) => r.schoolId === reviewData.schoolId && r.visitDate === todayStr
    );

    if (existingReport) {
      existingReport.keyPersonMet = personMetVal;
      if (reviewData.comment) {
        existingReport.discussionNotes = `${existingReport.discussionNotes} | [Review]: ${reviewData.comment}`;
      }
      if (reviewData.computerLabVerified) {
        existingReport.computerLabObserved = 'Yes';
      }
    } else {
      const dynamicReport: DPRReport = {
        id: `dpr-rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        schoolId: reviewData.schoolId,
        schoolName: reviewData.schoolName,
        schoolArea: school?.area || 'Hubli',
        officerId: this.session?.id || 'usr-field-01',
        officerName: reviewData.reviewerName || this.session?.name || 'Field Officer',
        visitDate: todayStr,
        visitDurationMinutes: 45,
        keyPersonMet: personMetVal,
        discussionNotes: `Field Visit Audit: ${reviewData.comment || 'Met representative and reviewed lab.'}`,
        computerLabObserved: reviewData.computerLabVerified ? 'Yes' : 'Partial',
        computersCountObserved: reviewData.computerLabVerified ? (school?.labComputersCount || 20) : 0,
        internetWorking: reviewData.computerLabVerified,
        actionItems: 'Follow up on technical education program and field review findings.',
        approvalStatus: 'SUBMITTED',
        createdAt: new Date().toISOString(),
      };
      this.reports.unshift(dynamicReport);
    }

    this.saveToLocalStorage();
    this.syncToBackend();
    this.notify();
    return newRev;
  }
}

export const store = new AppStore();
