import type { AttendanceStatus } from "@tutionassist/shared";

/**
 * Attendance % = (present + late) / (all sessions excluding excused) * 100.
 * Returns null when there is nothing to measure.
 */
export function attendancePercentage(statuses: AttendanceStatus[]): number | null {
  const counted = statuses.filter((s) => s !== "excused");
  if (counted.length === 0) return null;
  const attended = counted.filter((s) => s === "present" || s === "late").length;
  return Math.round((attended / counted.length) * 1000) / 10;
}
