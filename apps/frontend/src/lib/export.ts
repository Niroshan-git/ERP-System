/**
 * Client-side "export what's on screen" helpers shared by ExportMenu.tsx — mirrors ERPNext
 * Desk's list-view Export (rows currently rendered, not a server-side bulk data export).
 * Browser-only APIs (Blob, URL.createObjectURL, a temporary <a> click) — only ever call
 * these from a "use client" component, never from a server component.
 */

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(value: string | number): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const lines = [headers, ...rows].map((line) => line.map(csvEscape).join(","));
  const csv = lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(filename, blob);
}

export function exportToExcel(filename: string, headers: string[], rows: (string | number)[][]): void {
  // Dynamic import keeps this bundled into the ExportMenu chunk rather than every page that
  // imports export.ts indirectly through a table component.
  import("xlsx").then((XLSX) => {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, filename);
  });
}

export function exportToPdf(filename: string, headers: string[], rows: (string | number)[][]): void {
  Promise.all([import("jspdf"), import("jspdf-autotable")]).then(([{ default: JsPDF }, autoTableModule]) => {
    const autoTable = autoTableModule.default;
    const doc = new JsPDF();
    autoTable(doc, { head: [headers], body: rows });
    doc.save(filename);
  });
}
