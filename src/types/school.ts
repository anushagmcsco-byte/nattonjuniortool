export type PriorityLevel = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';

export type LabStatus = 'Yes' | 'No' | 'Unverified';

export type LabCheckState = 'Yes' | 'No' | 'Checking' | 'Queued' | 'Unverified' | 'Lookup failed';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  demoPassword?: string;
  role: UserRole;
  designation: string;
  zone: string;
  monthlyTarget: number;
  weeklyTarget: number;
  avatarInitials: string;
}

export interface SchoolRecord {
  id: string;
  code: string; // e.g. UDISE code or unique code
  name: string;
  board: string; // CBSE, ICSE, State Board, etc.
  category?: string; // Secondary, Higher Secondary, etc.
  industry?: string; // Education, etc.
  affiliationNumber?: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  website?: string;
  mapsUrl?: string;

  // Contact info
  contactPerson?: string;
  contactRole?: string;
  contactPhone?: string;
  contactEmail?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;

  // Visit info
  lastVisitedDate?: string;
  totalVisitsCount: number;
  daysSinceLastVisit: number;
  annualFeeMin?: number;
  annualFeeMax?: number;
  studentEnrollment: number;

  // Priority targeting
  priorityLevel: PriorityLevel;
  priorityScore: number;
  targetPriorityReason: string;
  suggestedVisitWeek?: string;
  suggestedAction?: string;

  // Computer Lab specific fields
  computerLab?: LabStatus; // 'Yes' | 'No' | 'Unverified'
  computerLabCheckStatus?: 'QUEUED' | 'CHECKING' | 'COMPLETED' | 'ERROR';
  computerLabCheckedAt?: string;
  computerLabSource?: 'OFFICIAL_WEBSITE' | 'UDISE_DIRECTORY' | 'UPLOAD' | 'VISIT' | 'PORTAL_HEURISTIC';
  computerLabSourceUrl?: string;
  labComputersCount?: number;
  labInternetAvailable?: string; // 'Yes (Broadband/LAN)' | 'No' | 'Not mentioned'
  labVerificationNote?: string;
  labConfidence?: number; // 0.0 - 1.0

  // Review & location
  uploadedReviewCount?: number | string;
  verificationAuditStatus?: string;
  uploadedData?: Record<string, string>;
  source?: string;
  sheetName?: string;
}

export interface LabVerificationProgress {
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETE' | 'ERROR';
  currentIndex: number;
  total: number;
  checked: number;
  confirmedYes: number;
  confirmedNo: number;
  unverified: number;
  currentSchoolName?: string;
  startTime?: number;
  elapsedSeconds: number;
  message?: string;
}

export interface DPRReport {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolArea: string;
  officerId: string;
  officerName: string;
  visitDate: string;
  visitDurationMinutes: number;
  keyPersonMet: string;
  discussionNotes: string;
  computerLabObserved: 'Yes' | 'No' | 'Partial';
  computersCountObserved?: number;
  internetWorking?: boolean;
  actionItems: string;
  followUpDueDate?: string;
  approvalStatus: 'SUBMITTED' | 'APPROVED_BY_ADMIN' | 'REVISION_REQUESTED';
  adminRemarks?: string;
  createdAt: string;
}

export interface SchoolReview {
  id: string;
  schoolId: string;
  schoolName: string;
  reviewerName: string;
  reviewerRole: string;
  personMet?: string; // Person Met during school visit
  rating: number; // 1-5
  comment: string;
  computerLabVerified: boolean;
  reviewedAt: string;
}

export interface UploadHistoryItem {
  id: string;
  filename: string;
  uploadedAt: string;
  recordsCount: number;
  records: SchoolRecord[];
  csvText?: string;
  ownerId?: string;
  ownerName?: string;
  canVisit?: boolean;
  canShare?: boolean;
  sheetNames?: string[];
  grants?: Record<string, 'NONE' | 'VIEW' | 'VISIT' | 'DOWNLOAD'>;
}

export interface RoadmapTimeSlotItem {
  slot: number | string;
  time: string;
  label: string;
  purpose: string;
  duration: string;
  isBreak?: boolean;
}

export interface ScheduledSchoolVisit {
  school: SchoolRecord;
  dayNumber: number;
  dayName: string;
  dateFormatted: string;
  slotNumber: number;
  timeSlot: string;
  activity: string;
  corridorArea: string;
}

export interface RoadmapDayPlan {
  dayNumber: number;
  dayName: string;
  dateFormatted: string;
  weekNumber: number;
  corridorArea: string;
  visits: ScheduledSchoolVisit[];
  totalVisits: number;
}

export interface RoadmapWeekPlan {
  weekNumber: number;
  label: string;
  days: RoadmapDayPlan[];
  totalSchools: number;
}

export interface RoadmapScheduleApiResponse {
  success: boolean;
  timing: {
    startTime: string;
    endTime: string;
    totalHours: number;
    totalMinutes: number;
    lunchMinutes: number;
    netVisitingMinutes: number;
    windowLabel: string;
  };
  accurateNumbers: {
    dayWiseTarget: number;
    weeklyTarget: number;
    monthlyTarget: number;
    workingDaysPerWeek: number;
    workingDaysPerMonth: number;
    totalSchoolsLoaded: number;
    totalDaysRequired: number;
    totalWeeksRequired: number;
    totalMonthsRequired: number;
    schoolsPerDayDetailed: {
      standard: number;
      intensive: number;
    };
    schoolsPerWeekDetailed: {
      standard: number;
      intensive: number;
    };
    schoolsPerMonthDetailed: {
      standard: number;
      intensive: number;
    };
  };
  timeSlots: RoadmapTimeSlotItem[];
  dailySchedule: RoadmapDayPlan[];
  weeklySchedule: RoadmapWeekPlan[];
  generatedAt: string;
  source: string;
}
