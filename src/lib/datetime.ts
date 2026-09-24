// Datas de turma são digitadas/exibidas no horário de Brasília (UTC-3, sem
// horário de verão no Brasil atualmente), mas guardadas como instantes UTC.

const BRASILIA_OFFSET_HOURS = 3;

/** Converte o valor de um <input type="datetime-local"> (horário de Brasília) pra um Date (UTC). */
export function parseBrasiliaDateTime(value: string) {
  return value ? new Date(`${value}-03:00`) : null;
}

/** Converte um Date de volta pro formato aceito por <input type="datetime-local">, em horário de Brasília. */
export function formatBrasiliaInputValue(date: Date | null | undefined) {
  if (!date) return "";
  const shifted = new Date(date.getTime() - BRASILIA_OFFSET_HOURS * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}
