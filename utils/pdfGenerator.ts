import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

(pdfMake as any).vfs = pdfFonts.vfs;

interface ReportData {
  title: string;
  headers: string[];
  rows: any[][];
  dateRange?: {
    from: string;
    to: string;
  };
}

export const generatePDF = (reports: ReportData[]) => {


  // Define styles
  const docDefinition = {
    pageOrientation: 'landscape' as const,
    pageMargins: [20, 60, 20, 60],
    header: (currentPage: number, pageCount: number) => {
      return {
        text: `Telecel Liberia Attendence $ Sales Reports - Page ${currentPage} of ${pageCount}`,
        alignment: 'center',
        margin: [0, 10, 0, 0],
        fontSize: 9,
        color: '#666'
      };
    },
    footer: (currentPage: number, pageCount: number) => {
      return {
        text: `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        alignment: 'center',
        margin: [0, 10, 0, 0],
        fontSize: 8,
        color: '#666'
      };
    },
    content: [] as any[],
    styles: {
      header: {
        fontSize: 22,
        bold: true,
        color: '#1f2937',
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 16,
        bold: true,
        color: '#374151',
        margin: [0, 10, 0, 5]
      },
      tableHeader: {
        bold: true,
        fontSize: 8,
        color: 'white',
        fillColor: '#dc2626',
        alignment: 'center'
      },
      tableCell: {
        fontSize: 7.5,
        lineHeight: 1.1
      },
      dateRange: {
        fontSize: 9,
        italic: true,
        color: '#6b7280',
        margin: [0, 0, 0, 10]
      }
    }
  };

  // Add title page
  docDefinition.content.push({
    text: 'Telecel Liberia Attendence $ Sales Reports',
    style: 'header',
    alignment: 'center',
    margin: [0, 20, 0, 30]
  });

  docDefinition.content.push({
    text: `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    alignment: 'center',
    fontSize: 11,
    color: '#6b7280',
    margin: [0, 0, 0, 30]
  });

  // Add each report
  reports.forEach((report, index) => {
    console.log(`[PDF Generator] Processing report ${index + 1}: "${report.title}"`);

    if (index > 0) {
      docDefinition.content.push({ text: '', pageBreak: 'before' });
    }

    // Add report title
    docDefinition.content.push({
      text: report.title,
      style: 'subheader'
    });

    // Add date range if available
    if (report.dateRange) {
      docDefinition.content.push({
        text: `Date Range: ${new Date(report.dateRange.from).toLocaleDateString()} - ${new Date(report.dateRange.to).toLocaleDateString()}`,
        style: 'dateRange'
      });
    }

    // ➤➤➤ Initialize widths safely
    let columnWidths: (string | number)[] = new Array(report.headers.length).fill('*').map(w => w ?? '*');

    // ➤➤➤ Assign widths by report type
    if (report.title === 'Sales Report') {
      columnWidths = [
        50,   // Sales Rep
        '*',  // Client Name
        55,   // Phone
        '*',  // Email
        '*',  // Task Title
        50,   // Task Type
        60,   // Start Time
       
        35,   // Completed
        35,   // Converted
        55,   // Actual Revenue
        55    // Potential Revenue
      ];
    } else if (report.title === 'Attendance Report') {
      columnWidths = [
        '*',    // Employee Name
        '*',    // Email
        50,     // Department
        50,     // Date
        45,     // Sign In
        45,     // Sign Out
        55,     // Workplace
        40      // Status
      ];
    } else if (report.title === 'Team Report') {
      columnWidths = [
        '*',    // Name
        40,     // ← FIXED: No leading space before 40
        40,     // Completed Tasks
        55,     // Conversions
        65      // Avg Revenue per Conversion
      ];
    }

    // ➤➤➤ VALIDATE DATA BEFORE RENDERING
    if (report.rows.length > 0) {
      const headerCount = report.headers.length;
      const firstRowCount = report.rows[0].length;
      const widthCount = columnWidths.length;

      // Check for undefined/null widths
      const invalidWidthIndex = columnWidths.findIndex(w => w === undefined || w === null);
      if (invalidWidthIndex !== -1) {
        throw new Error(`Invalid width at index ${invalidWidthIndex} in report "${report.title}": ${columnWidths[invalidWidthIndex]}`);
      }

      // Check column count alignment
      if (headerCount !== firstRowCount || headerCount !== widthCount) {
        console.error("[PDF Generator] MISMATCH DETECTED:", {
          report: report.title,
          headers: headerCount,
          dataColumns: firstRowCount,
          widthColumns: widthCount,
          headersList: report.headers,
          sampleRow: report.rows[0],
          widthList: columnWidths
        });
        throw new Error(
          `Column count mismatch in "${report.title}": ` +
          `Headers: ${headerCount}, Data: ${firstRowCount}, Widths: ${widthCount}`
        );
      }
    }

    // Build table body
    const tableBody = [
      report.headers.map(header => ({
        text: header,
        style: 'tableHeader',
        noWrap: false,
        alignment: 'center'
      }))
    ];

    report.rows.forEach((row, rowIndex) => {
      // Validate each row has correct number of cells
      if (row.length !== report.headers.length) {
        console.warn(`[PDF Generator] Row ${rowIndex} in "${report.title}" has ${row.length} cells, expected ${report.headers.length}`);
        // Pad or trim row to match header length
        while (row.length < report.headers.length) row.push('');
        if (row.length > report.headers.length) row = row.slice(0, report.headers.length);
      }

      tableBody.push(
        row.map(cell => {
          const displayText = typeof cell === 'object' ? JSON.stringify(cell) : cell?.toString() || '';
          return {
            text: displayText,
            style: 'tableCell',
            noWrap: false,
            alignment: typeof cell === 'number' ? 'right' : 'left'
          };
        })
      );
    });

    // Add table to document
    docDefinition.content.push({
      table: {
        headerRows: 1,
        widths: columnWidths,
        body: tableBody
      },
      layout: {
        hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0.7 : 0.3),
        vLineWidth: () => 0.3,
        hLineColor: () => '#aaa',
        vLineColor: () => '#ddd',
      },
      margin: [0, 5, 0, 15]
    });
  });



  const pdfDoc = (pdfMake as any).createPdf(docDefinition);


  return pdfDoc;
};