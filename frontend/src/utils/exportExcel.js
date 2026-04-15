import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Export an array of objects to an Excel .xlsx file.
 * @param {Object[]} data - Array of row objects
 * @param {string} sheetName - Name of the worksheet
 * @param {string} fileName - File name (without extension)
 */
export function exportToExcel(data, sheetName, fileName) {
  if (!data || data.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${fileName}.xlsx`);
}

/**
 * Export multiple sheets to a single Excel .xlsx file.
 * @param {Array<{name: string, data: Object[]}>} sheets - Array of { name, data }
 * @param {string} fileName - File name (without extension)
 */
export function exportMultiSheetExcel(sheets, fileName) {
  const wb = XLSX.utils.book_new();
  for (const { name, data } of sheets) {
    if (!data || data.length === 0) continue;
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
  }
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${fileName}.xlsx`);
}

/**
 * Export multiple data sections into a SINGLE sheet with section-header rows.
 * Each section gets a bold-ish title row, then column headers, then data rows,
 * followed by a blank separator row before the next section.
 * @param {Array<{name: string, data: Object[]}>} sections - Array of { name, data }
 * @param {string} fileName - File name (without extension)
 */
export function exportSectionsToSingleSheet(sections, fileName) {
  const rows = [];
  for (const { name, data } of sections) {
    if (!data || data.length === 0) continue;
    const keys = Object.keys(data[0]);
    // Section title row (first cell is name, rest are empty)
    const titleRow = {};
    keys.forEach((k, i) => { titleRow[k] = i === 0 ? `── ${name} ──` : ''; });
    rows.push(titleRow);
    // Data rows
    for (const d of data) rows.push(d);
    // Blank separator
    const blankRow = {};
    keys.forEach(k => { blankRow[k] = ''; });
    rows.push(blankRow);
  }
  if (rows.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${fileName}.xlsx`);
}
