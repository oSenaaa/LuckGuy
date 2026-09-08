/**
 * The course's registered default duration is the source of truth for a
 * session's workload — falls back to the session's own stored value only
 * for courses that don't have a default duration configured.
 */
export function resolveWorkloadHours(
  courseDefaultDurationMinutes: number | null,
  fallbackHours: number,
): number {
  return courseDefaultDurationMinutes != null ? courseDefaultDurationMinutes / 60 : fallbackHours;
}

export function formatWorkload(hours: number): string {
  if (hours > 0 && hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
  }

  const rounded = Math.round(hours * 100) / 100;
  const label = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",");
  return `${label} ${rounded === 1 ? "hora" : "horas"}`;
}
