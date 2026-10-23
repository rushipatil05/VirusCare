/**
 * Formats YYYY-MM-DD or Date object into DD/MM (e.g. "18/10")
 */
export const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`; // DD/MM (e.g. 18/10)
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }
  return dateStr;
};

/**
 * Formats YYYY-MM-DD or Date object into DD/MM/YYYY (e.g. "18/10/2026")
 */
export const formatDisplayDate = (dateVal) => {
  if (!dateVal) return '—';
  if (typeof dateVal === 'string' && dateVal.includes('-') && !dateVal.includes('T')) {
    const parts = dateVal.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
  }
  const d = new Date(dateVal);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return String(dateVal);
};

/**
 * Formats Date object into DD/MM/YYYY, HH:MM
 */
export const formatDateTime = (dateVal) => {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year}, ${hours}:${minutes}`;
};
