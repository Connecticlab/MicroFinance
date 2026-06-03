/**
 * Formate une date YYYY-MM-DD en DD/MM/YYYY
 * @param {string} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '—';
  const parts = date.split('T')[0].split('-');
  if (parts.length !== 3) return date;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
