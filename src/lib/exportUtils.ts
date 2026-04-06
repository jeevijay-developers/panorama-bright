import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Papa from "papaparse";

export const downloadCSV = (data: any[], fileName: string) => {
  if (!data || data.length === 0) return;
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadExcel = (data: any[], fileName: string) => {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const downloadPDF = (
  data: any[],
  columns: { header: string; dataKey: string }[],
  fileName: string,
  title: string
) => {
  if (!data || data.length === 0) return;
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);

  // Generation Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  autoTable(doc, {
    startY: 36,
    columns: columns,
    body: data,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`${fileName}.pdf`);
};
