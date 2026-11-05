import { SchoolRecord, RoadmapScheduleApiResponse, RoadmapDayPlan, RoadmapWeekPlan, ScheduledSchoolVisit, RoadmapTimeSlotItem } from '../types/school';
import { extractAreaFromSchool } from './areaExtractor';

export interface ScheduleOptions {
  startTime?: string; // "09:00"
  endTime?: string; // "15:00"
  pace?: 'standard' | 'intensive'; // standard = 3/day, intensive = 4/day
  daysPerWeek?: number; // 5 or 6 (default 6)
  monthName?: string; // "November 2026"
  officerName?: string;
}

const STANDARD_TIME_SLOTS: RoadmapTimeSlotItem[] = [
  {
    slot: 1,
    time: '09:00 AM - 10:15 AM',
    label: 'Morning Primary Slot (Assembly / Principal Meet)',
    purpose: 'Principal & Person Met briefing, program introduction & permissions',
    duration: '75 min (50m visit + 25m transit)',
    isBreak: false,
  },
  {
    slot: 2,
    time: '10:45 AM - 12:00 PM',
    label: 'Mid-Morning ICT Slot (Computer Lab Physical Inspection)',
    purpose: 'Computer Lab audit, PC counts, LAN/broadband test & photo evidence',
    duration: '75 min (50m visit + 25m transit)',
    isBreak: false,
  },
  {
    slot: 'Break',
    time: '12:00 PM - 12:45 PM',
    label: 'Mid-Day Lunch & DPR Synchronisation Break',
    purpose: 'Transit to afternoon corridor, lunch, and DPR report log submission',
    duration: '45 min',
    isBreak: true,
  },
  {
    slot: 3,
    time: '12:45 PM - 02:00 PM',
    label: 'Afternoon Academic Slot (Curriculum & Teacher Briefing)',
    purpose: 'Computer science / Math coordinator discussion, student batch planning',
    duration: '75 min (50m visit + 25m transit)',
    isBreak: false,
  },
  {
    slot: 4,
    time: '02:00 PM - 03:00 PM',
    label: 'Wrap-up Buffer & Follow-up Slot',
    purpose: 'Final campus wrap-up before 3:00 PM dismissal / high-priority re-visit',
    duration: '60 min',
    isBreak: false,
  },
];

const INTENSIVE_TIME_SLOTS: RoadmapTimeSlotItem[] = [
  {
    slot: 1,
    time: '09:00 AM - 10:15 AM',
    label: 'Slot 1: Morning Opening Visit',
    purpose: 'Principal & Person Met briefing, lab walkthrough',
    duration: '75 min',
    isBreak: false,
  },
  {
    slot: 2,
    time: '10:30 AM - 11:45 AM',
    label: 'Slot 2: Mid-Morning Inspection',
    purpose: 'Computer lab audit & infrastructure check',
    duration: '75 min',
    isBreak: false,
  },
  {
    slot: 'Break',
    time: '11:45 AM - 12:30 PM',
    label: 'Corridor Transit & Lunch Break',
    purpose: 'Field lunch and route repositioning',
    duration: '45 min',
    isBreak: true,
  },
  {
    slot: 3,
    time: '12:30 PM - 01:45 PM',
    label: 'Slot 3: Early Afternoon Consultation',
    purpose: 'ICT Coordinator meeting & student enrollment verification',
    duration: '75 min',
    isBreak: false,
  },
  {
    slot: 4,
    time: '01:45 PM - 03:00 PM',
    label: 'Slot 4: Final Campus Verification',
    purpose: 'End-of-day campus sign-off before 3:00 PM dismissal',
    duration: '75 min',
    isBreak: false,
  },
];

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Calculates exact field schedule and accurate targets for 9:00 AM - 3:00 PM school visiting hours.
 */
export function calculateRoadmapSchedule(
  schools: SchoolRecord[],
  options: ScheduleOptions = {}
): RoadmapScheduleApiResponse {
  const startTime = options.startTime || '09:00';
  const endTime = options.endTime || '15:00';
  const pace = options.pace || 'standard';
  const daysPerWeek = options.daysPerWeek === 5 ? 5 : 6;
  const monthName = options.monthName || 'Current Month';

  // Accurate Day, Week, Month targets for 9:00 AM - 3:00 PM (6 hours window)
  const dayWiseTarget = pace === 'intensive' ? 4 : 3;
  const weeklyTarget = dayWiseTarget * daysPerWeek; // 18 (or 24 for intensive; or 15 / 20 for 5-day week)
  const workingDaysPerMonth = daysPerWeek === 6 ? 24 : 20;
  const monthlyTarget = dayWiseTarget * workingDaysPerMonth; // 72 (or 96 for intensive; or 60 / 80 for 5-day week)

  const activeTimeSlots = pace === 'intensive' ? INTENSIVE_TIME_SLOTS : STANDARD_TIME_SLOTS;

  // Cluster schools by Area / Locality to make 9 AM - 3 PM routes hyper-efficient
  const clusteredSchools = [...schools].sort((a, b) => {
    const areaA = extractAreaFromSchool(a.name, a.area, a.city).toLowerCase();
    const areaB = extractAreaFromSchool(b.name, b.area, b.city).toLowerCase();
    if (areaA < areaB) return -1;
    if (areaA > areaB) return 1;
    return a.name.localeCompare(b.name);
  });

  const totalLoaded = clusteredSchools.length;
  const totalDaysRequired = totalLoaded > 0 ? Math.ceil(totalLoaded / dayWiseTarget) : 0;
  const totalWeeksRequired = totalDaysRequired > 0 ? Math.ceil(totalDaysRequired / daysPerWeek) : 0;
  const totalMonthsRequired =
    totalDaysRequired > 0 ? Math.round((totalDaysRequired / workingDaysPerMonth) * 10) / 10 : 0;

  // Build day-wise schedule
  const dailySchedule: RoadmapDayPlan[] = [];
  const slotOptions = pace === 'intensive'
    ? [
        { slotNumber: 1, timeSlot: '09:00 AM - 10:15 AM', activity: 'Morning Principal & Representative Briefing' },
        { slotNumber: 2, timeSlot: '10:30 AM - 11:45 AM', activity: 'Mid-Morning Computer Lab & ICT Audit' },
        { slotNumber: 3, timeSlot: '12:30 PM - 01:45 PM', activity: 'Afternoon Curriculum & Batch Planning' },
        { slotNumber: 4, timeSlot: '01:45 PM - 03:00 PM', activity: 'Final Campus Verification & Sign-off' },
      ]
    : [
        { slotNumber: 1, timeSlot: '09:00 AM - 10:15 AM', activity: 'Principal & Person Met Briefing (Assembly Slot)' },
        { slotNumber: 2, timeSlot: '10:45 AM - 12:00 PM', activity: 'Computer Lab Physical Audit & Systems Check' },
        { slotNumber: 3, timeSlot: '12:45 PM - 02:00 PM', activity: 'ICT Coordinator & Student Batch Review' },
        { slotNumber: 4, timeSlot: '02:00 PM - 03:00 PM', activity: 'Wrap-up & DPR Evidence Documentation' },
      ];

  for (let dayIdx = 0; dayIdx < totalDaysRequired; dayIdx++) {
    const startIdx = dayIdx * dayWiseTarget;
    const daySchools = clusteredSchools.slice(startIdx, startIdx + dayWiseTarget);
    const dayOfWeekIdx = dayIdx % daysPerWeek;
    const dayName = DAY_NAMES[dayOfWeekIdx] || 'Field Day';
    const weekNumber = Math.floor(dayIdx / daysPerWeek) + 1;

    // Determine primary area for this day
    const primaryArea =
      daySchools.length > 0 ? extractAreaFromSchool(daySchools[0].name, daySchools[0].area, daySchools[0].city) : 'General Zone';

    const visits: ScheduledSchoolVisit[] = daySchools.map((school, sIdx) => {
      const slot = slotOptions[sIdx] || slotOptions[slotOptions.length - 1];
      const schoolArea = extractAreaFromSchool(school.name, school.area, school.city);
      return {
        school,
        dayNumber: dayIdx + 1,
        dayName,
        dateFormatted: `${dayName} (Day ${dayIdx + 1})`,
        slotNumber: slot.slotNumber,
        timeSlot: slot.timeSlot,
        activity: slot.activity,
        corridorArea: schoolArea,
      };
    });

    dailySchedule.push({
      dayNumber: dayIdx + 1,
      dayName,
      dateFormatted: `${monthName} • Day ${dayIdx + 1} (${dayName})`,
      weekNumber,
      corridorArea: primaryArea,
      visits,
      totalVisits: visits.length,
    });
  }

  // Build weekly schedule
  const weeklySchedule: RoadmapWeekPlan[] = [];
  for (let wIdx = 0; wIdx < totalWeeksRequired; wIdx++) {
    const weekNumber = wIdx + 1;
    const weekDays = dailySchedule.filter((d) => d.weekNumber === weekNumber);
    const totalSchoolsInWeek = weekDays.reduce((acc, d) => acc + d.visits.length, 0);

    weeklySchedule.push({
      weekNumber,
      label: `Week ${weekNumber} (${monthName} — ${weekDays.length} Field Days)`,
      days: weekDays,
      totalSchools: totalSchoolsInWeek,
    });
  }

  return {
    success: true,
    timing: {
      startTime,
      endTime,
      totalHours: 6,
      totalMinutes: 360,
      lunchMinutes: 45,
      netVisitingMinutes: 315,
      windowLabel: `${startTime === '09:00' ? '9:00 AM' : startTime} – ${endTime === '15:00' ? '3:00 PM' : endTime} (6 hrs active field window)`,
    },
    accurateNumbers: {
      dayWiseTarget,
      weeklyTarget,
      monthlyTarget,
      workingDaysPerWeek: daysPerWeek,
      workingDaysPerMonth,
      totalSchoolsLoaded: totalLoaded,
      totalDaysRequired,
      totalWeeksRequired,
      totalMonthsRequired,
      schoolsPerDayDetailed: {
        standard: 3,
        intensive: 4,
      },
      schoolsPerWeekDetailed: {
        standard: 3 * daysPerWeek,
        intensive: 4 * daysPerWeek,
      },
      schoolsPerMonthDetailed: {
        standard: 3 * workingDaysPerMonth,
        intensive: 4 * workingDaysPerMonth,
      },
    },
    timeSlots: activeTimeSlots,
    dailySchedule,
    weeklySchedule,
    generatedAt: new Date().toISOString(),
    source: 'FIELD_LOGISTICS_ENGINE_9TO3_ACCURATE',
  };
}
