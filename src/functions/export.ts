import ExcelJS from "exceljs";
import dayjs from "dayjs";

export interface ExportColumn<T> {
  header: string;
  accessorKey?: keyof T | string;
  formatter?: (value: any, row: T) => string;
}

export interface ExportOptions<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename?: string;
  sheetName?: string;
}

/**
 * Convert data to CSV format
 */
function convertToCSV<T>(data: T[], columns: ExportColumn<T>[]): string {
  if (!data || data.length === 0) {
    return "";
  }

  const headers = columns.map((col) => `"${col.header}"`).join(",");

  const rows = data.map((row) => {
    return columns
      .map((col) => {
        let value = "";

        if (typeof col.accessorKey === "string") {
          const keys = col.accessorKey.split(".");
          let current: any = row;
          for (const key of keys) {
            current = current?.[key];
          }
          value = current;
        } else {
          value = (row as any)[col.accessorKey];
        }

        // Apply formatter if provided
        if (col.formatter) {
          value = col.formatter(value, row);
        }

        if (value === null || value === undefined || value === "") {
          return '"-"';
        }

        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(",");
  });

  return [headers, ...rows].join("\n");
}

/**
 * Download CSV file
 */
function downloadCSV(csvContent: string, filename: string) {
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T>(options: ExportOptions<T>) {
  const {
    data,
    columns,
    filename = `export_${dayjs().format("YYYY-MM-DD")}.csv`,
  } = options;

  if (!data || data.length === 0) {
    return;
  }

  try {
    const csvContent = convertToCSV(data, columns);
    downloadCSV(csvContent, filename);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    throw error;
  }
}

/**
 * Export data to Excel file with styling
 */
export async function exportToExcel<T extends Record<string, any>>(
  options: ExportOptions<T>,
) {
  const {
    data,
    columns,
    filename = `export_${dayjs().format("YYYY-MM-DD")}.xlsx`,
    sheetName = "Sheet1",
  } = options;

  if (!data || data.length === 0) {
    return;
  }

  try {
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add header row
    const headerRow = worksheet.addRow(columns.map((col) => col.header));

    // Style header row
    headerRow.eachCell((cell: ExcelJS.Cell) => {
      cell.font = { bold: true, color: { argb: "FF000000" } };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFC2D6EC" }, // Light blue background
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });

    // Add data rows
    data.forEach((row) => {
      const rowData: any[] = [];
      columns.forEach((col) => {
        let value = "";

        if (typeof col.accessorKey === "string") {
          const keys = col.accessorKey.split(".");
          let current: any = row;
          for (const key of keys) {
            current = current?.[key];
          }
          value = current;
        } else {
          value = (row as any)[col.accessorKey];
        }

        // Apply formatter if provided
        if (col.formatter) {
          value = col.formatter(value, row);
        }

        if (value === null || value === undefined || value === "") {
          value = "-";
        }

        if (typeof value === "number" && !Number.isNaN(value)) {
          value = String(value);
        }

        rowData.push(value);
      });

      const dataRow = worksheet.addRow(rowData);

      // Style data rows with borders
      dataRow.eachCell((cell: ExcelJS.Cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      });
    });

    // Calculate column widths
    columns.forEach((col, index) => {
      let maxLength = col.header.length;
      data.forEach((row) => {
        let value: any = "";
        if (typeof col.accessorKey === "string") {
          const keys = col.accessorKey.split(".");
          let current: any = row;
          for (const key of keys) {
            current = current?.[key];
          }
          value = current;
        } else {
          value = (row as any)[col.accessorKey];
        }
        if (col.formatter) {
          value = col.formatter(value, row);
        }
        const cellLength = String(value ?? "").length;
        maxLength = Math.max(maxLength, cellLength);
      });
      worksheet.getColumn(index + 1).width = Math.min(
        Math.max(maxLength + 4, 10),
        60,
      );
    });

    // Write to buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting Excel:", error);
    throw error;
  }
}
