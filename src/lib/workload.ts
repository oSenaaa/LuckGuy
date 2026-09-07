export function formatWorkload(hours: number): string {
  if (hours > 0 && hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
  }

  const rounded = Math.round(hours * 100) / 100;
  const label = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",");
  return `${label} ${rounded === 1 ? "hora" : "horas"}`;
}
