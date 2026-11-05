import { SchoolRecord, RoadmapScheduleApiResponse } from '../types/school';
import { calculateRoadmapSchedule, ScheduleOptions } from '../utils/roadmapScheduleEngine';

export async function fetchRoadmapScheduleFromApi(
  schools: SchoolRecord[],
  options: ScheduleOptions = {}
): Promise<RoadmapScheduleApiResponse> {
  const startTime = options.startTime || '09:00';
  const endTime = options.endTime || '15:00';
  const pace = options.pace || 'standard';
  const daysPerWeek = options.daysPerWeek || 6;
  const monthName = options.monthName || 'November 2026';

  try {
    const response = await fetch('/api/roadmap-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startTime,
        endTime,
        pace,
        daysPerWeek,
        monthName,
        schools: schools.map((s) => ({
          id: s.id,
          name: s.name,
          area: s.area,
          city: s.city,
          state: s.state,
          board: s.board,
          studentEnrollment: s.studentEnrollment,
          computerLab: s.computerLab,
          labComputersCount: s.labComputersCount,
          contactPerson: s.contactPerson,
          contactPhone: s.contactPhone,
          sheetName: s.sheetName,
          mapsUrl: s.mapsUrl,
          assignedOfficerName: s.assignedOfficerName,
        })),
      }),
    });

    if (response.ok) {
      const data: RoadmapScheduleApiResponse = await response.json();
      if (data && data.success) {
        return data;
      }
    }
  } catch (err) {
    console.warn('API fetch for roadmap schedule failed, falling back to client engine:', err);
  }

  // Graceful local computation fallback if network/server is interrupted
  return calculateRoadmapSchedule(schools, {
    startTime,
    endTime,
    pace,
    daysPerWeek,
    monthName,
  });
}
