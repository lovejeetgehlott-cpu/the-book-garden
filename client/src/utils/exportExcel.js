import * as XLSX from 'xlsx';

/**
 * Download an array of plain objects as an .xlsx file.
 * Keys become the column headers (insertion order kept).
 * Returns false when rows is empty (caller shows a message), true on success.
 */
export const exportToExcel = (filename, rows) => {
  if (!rows || rows.length === 0) return false;
  const ws = XLSX.utils.json_to_sheet(rows);
  // Sensible column widths: longest value (or header) + padding, capped at 40
  const keys = Object.keys(rows[0]);
  ws['!cols'] = keys.map((k) => ({
    wch: Math.min(40, Math.max(k.length, ...rows.map((r) => String(r[k] ?? '').length)) + 2),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}.xlsx`);
  return true;
};
