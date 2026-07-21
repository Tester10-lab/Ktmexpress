import ExcelJS from 'exceljs';

/**
 * Generates a production-grade Excel Workbook containing 2 sheets:
 * Sheet 1: "Packages Detail" - Comprehensive package records with formulas and styling
 * Sheet 2: "Daily Summary & Financials" - Executive KPIs, status distribution, financial reconciliation, vendor summary
 *
 * @param {Object} options
 * @param {Array} options.packages - Array of populated Package Mongoose lean objects
 * @param {Array} options.expenses - Array of Expense objects
 * @param {String} options.dateStr - Date string or range label (e.g. "2026-07-21")
 * @returns {Promise<ExcelJS.Workbook>}
 */
export const buildDailyExcelWorkbook = async ({ packages = [], expenses = [], dateStr = 'All-Time' }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ktmexpress Logistics System';
  workbook.lastModifiedBy = 'Production Database System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ─────────────────────────────────────────────────────────────────────────
  // SHEET 1: PACKAGES DETAIL
  // ─────────────────────────────────────────────────────────────────────────
  const sheet1 = workbook.addWorksheet('Packages Detail', {
    pageSetup: { paperSize: 9, orientation: 'landscape' },
    views: [{ state: 'frozen', ySplit: 2 }]
  });

  // Title Banner for Sheet 1
  sheet1.mergeCells('A1:U1');
  const titleCell1 = sheet1.getCell('A1');
  titleCell1.value = `KTMEXPRESS LOGISTICS - PRODUCTION DATABASE DAILY EXPORT (${dateStr})`;
  titleCell1.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Dark Slate
  titleCell1.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet1.getRow(1).height = 30;

  // Columns Configuration for Sheet 1
  const columnsSheet1 = [
    { header: 'S.N.', key: 'sn', width: 8 },
    { header: 'Tracking Code', key: 'trackingCode', width: 16 },
    { header: 'Invoice ID', key: 'invoiceId', width: 16 },
    { header: 'Vendor Name', key: 'vendorName', width: 24 },
    { header: 'Customer Name', key: 'customerName', width: 22 },
    { header: 'Customer Phone', key: 'customerPhone', width: 16 },
    { header: 'Delivery Address', key: 'address', width: 32 },
    { header: 'City', key: 'city', width: 16 },
    { header: 'Out of Valley', key: 'outOfValley', width: 14 },
    { header: 'Weight (kg)', key: 'weight', width: 12 },
    { header: 'COD Amount (Rs.)', key: 'amount', width: 18 },
    { header: 'Delivery Fee (Rs.)', key: 'deliveryCharge', width: 18 },
    { header: 'Vendor Receivable (Rs.)', key: 'vendorReceivable', width: 22 },
    { header: 'Package Status', key: 'status', width: 18 },
    { header: 'Rider Name', key: 'riderName', width: 20 },
    { header: 'Settlement Status', key: 'settlementStatus', width: 18 },
    { header: 'COD Verified', key: 'codVerified', width: 14 },
    { header: 'Vendor Paid', key: 'vendorPaid', width: 14 },
    { header: 'Delivery Date', key: 'deliveryDate', width: 16 },
    { header: 'Created At', key: 'createdAt', width: 18 },
    { header: 'Updated At', key: 'updatedAt', width: 18 }
  ];

  // Header Row 2
  const headerRow2 = sheet1.getRow(2);
  columnsSheet1.forEach((col, idx) => {
    const cell = headerRow2.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Navy Dark
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF334155' } }
    };
    sheet1.getColumn(idx + 1).width = col.width;
  });
  headerRow2.height = 24;

  // Populate Package Rows
  let rowIndex = 3;
  packages.forEach((pkg, index) => {
    const row = sheet1.getRow(rowIndex);
    const vendorName = pkg.vendorId?.vendorMeta?.shopName || pkg.vendorId?.name || 'N/A';
    const riderName = pkg.riderId?.name || 'Unassigned';
    const isEven = index % 2 === 0;
    const bgFill = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // Light zebra stripe

    row.values = [
      index + 1,
      pkg.trackingCode || '',
      pkg.invoiceId || '',
      vendorName,
      pkg.customerName || '',
      pkg.customerPhone || '',
      pkg.address || '',
      pkg.city || 'Kathmandu',
      pkg.outOfValley ? 'Yes' : 'No',
      Number(pkg.weight || 0.5),
      Number(pkg.amount || 0),
      Number(pkg.deliveryCharge || 0),
      Number(pkg.vendorReceivable || 0),
      pkg.status || 'Pending',
      riderName,
      pkg.settlementStatus || 'Pending',
      pkg.codVerified ? 'Yes' : 'No',
      pkg.vendorPaid ? 'Yes' : 'No',
      pkg.deliveryDate ? new Date(pkg.deliveryDate).toISOString().split('T')[0] : 'N/A',
      pkg.createdAt ? new Date(pkg.createdAt).toISOString().replace('T', ' ').substring(0, 16) : '',
      pkg.updatedAt ? new Date(pkg.updatedAt).toISOString().replace('T', ' ').substring(0, 16) : ''
    ];

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgFill } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      if (colNumber === 1 || colNumber === 9 || colNumber === 17 || colNumber === 18) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 10) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '0.00';
      } else if (colNumber >= 11 && colNumber <= 13) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = 'Rs. #,##0.00';
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });

    row.height = 20;
    rowIndex++;
  });

  // Summary / Formula Row
  if (packages.length > 0) {
    const totalRow = sheet1.getRow(rowIndex);
    totalRow.getCell(1).value = 'TOTAL';
    totalRow.getCell(1).font = { name: 'Arial', size: 10, bold: true };
    totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    totalRow.getCell(11).value = { formula: `SUM(K3:K${rowIndex - 1})` };
    totalRow.getCell(11).numFmt = 'Rs. #,##0.00';
    totalRow.getCell(11).font = { name: 'Arial', size: 10, bold: true };
    totalRow.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' };

    totalRow.getCell(12).value = { formula: `SUM(L3:L${rowIndex - 1})` };
    totalRow.getCell(12).numFmt = 'Rs. #,##0.00';
    totalRow.getCell(12).font = { name: 'Arial', size: 10, bold: true };
    totalRow.getCell(12).alignment = { horizontal: 'right', vertical: 'middle' };

    totalRow.getCell(13).value = { formula: `SUM(M3:M${rowIndex - 1})` };
    totalRow.getCell(13).numFmt = 'Rs. #,##0.00';
    totalRow.getCell(13).font = { name: 'Arial', size: 10, bold: true };
    totalRow.getCell(13).alignment = { horizontal: 'right', vertical: 'middle' };

    totalRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF0F172A' } },
        bottom: { style: 'double', color: { argb: 'FF0F172A' } }
      };
    });
    totalRow.height = 24;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SHEET 2: DAILY SUMMARY & FINANCIALS
  // ─────────────────────────────────────────────────────────────────────────
  const sheet2 = workbook.addWorksheet('Daily Summary & Financials', {
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });

  sheet2.columns = [
    { key: 'A', width: 6 },
    { key: 'B', width: 34 },
    { key: 'C', width: 22 },
    { key: 'D', width: 22 },
    { key: 'E', width: 22 },
    { key: 'F', width: 22 }
  ];

  let currRow = 1;

  // Title Block
  sheet2.mergeCells(`B${currRow}:F${currRow}`);
  const titleCell2 = sheet2.getCell(`B${currRow}`);
  titleCell2.value = 'KTMEXPRESS LOGISTICS - DAILY SUMMARY & FINANCIAL RECONCILIATION';
  titleCell2.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  titleCell2.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet2.getRow(currRow).height = 32;
  currRow += 2;

  // Metadata Block
  const metaItems = [
    ['Export Target Period:', dateStr],
    ['Generated Timestamp:', new Date().toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }) + ' (NPT)'],
    ['Total Packages Exported:', packages.length],
  ];
  metaItems.forEach(([label, val]) => {
    sheet2.getCell(`B${currRow}`).value = label;
    sheet2.getCell(`B${currRow}`).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF334155' } };
    sheet2.getCell(`C${currRow}`).value = val;
    sheet2.getCell(`C${currRow}`).font = { name: 'Arial', size: 10 };
    currRow++;
  });
  currRow += 1;

  const addSectionHeader = (title) => {
    sheet2.mergeCells(`B${currRow}:F${currRow}`);
    const secCell = sheet2.getCell(`B${currRow}`);
    secCell.value = title.toUpperCase();
    secCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    secCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    secCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    sheet2.getRow(currRow).height = 24;
    currRow++;
  };

  // Section 1: Financial KPI Metrics
  addSectionHeader('1. Executive Financial Metrics');

  const totalCOD = packages.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalDeliveryFee = packages.reduce((sum, p) => sum + (p.deliveryCharge || 0), 0);
  const totalVendorReceivable = packages.reduce((sum, p) => sum + (p.vendorReceivable || 0), 0);

  const deliveredPackages = packages.filter(p => p.status === 'Delivered');
  const deliveredCOD = deliveredPackages.reduce((sum, p) => sum + (p.amount || 0), 0);
  const deliveredFee = deliveredPackages.reduce((sum, p) => sum + (p.deliveryCharge || 0), 0);

  const verifiedCOD = packages.filter(p => p.codVerified).reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidVendorAmt = packages.filter(p => p.vendorPaid).reduce((sum, p) => sum + (p.vendorReceivable || 0), 0);
  const pendingVendorAmt = packages.filter(p => p.status === 'Delivered' && !p.vendorPaid).reduce((sum, p) => sum + (p.vendorReceivable || 0), 0);

  const totalExpensesAmt = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const financialMetrics = [
    ['Total COD Volume (All Packages)', totalCOD, 'Rs. #,##0.00'],
    ['Delivered COD Collected', deliveredCOD, 'Rs. #,##0.00'],
    ['Total Delivery Charges (Gross Revenue)', totalDeliveryFee, 'Rs. #,##0.00'],
    ['Delivered Packages Charges (Realized Revenue)', deliveredFee, 'Rs. #,##0.00'],
    ['Total Vendor Receivables (Payable)', totalVendorReceivable, 'Rs. #,##0.00'],
    ['Verified COD Amount (Admin Checked)', verifiedCOD, 'Rs. #,##0.00'],
    ['Paid Vendor Settlements', paidVendorAmt, 'Rs. #,##0.00'],
    ['Pending Vendor Payables', pendingVendorAmt, 'Rs. #,##0.00'],
    ['Total Operational Rider Expenses', totalExpensesAmt, 'Rs. #,##0.00'],
  ];

  const finHeaderRow = sheet2.getRow(currRow);
  finHeaderRow.getCell(2).value = 'Metric Description';
  finHeaderRow.getCell(3).value = 'Amount (Rs.)';
  [2, 3].forEach(col => {
    const c = finHeaderRow.getCell(col);
    c.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    c.border = { bottom: { style: 'medium', color: { argb: 'FF0F172A' } } };
  });
  currRow++;

  financialMetrics.forEach(([label, val, fmt]) => {
    const r = sheet2.getRow(currRow);
    r.getCell(2).value = label;
    r.getCell(2).font = { name: 'Arial', size: 9.5 };
    r.getCell(3).value = val;
    r.getCell(3).numFmt = fmt;
    r.getCell(3).font = { name: 'Arial', size: 9.5, bold: true };
    r.getCell(3).alignment = { horizontal: 'right' };

    [2, 3].forEach(col => {
      r.getCell(col).border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });
    currRow++;
  });
  currRow += 2;

  // Section 2: Package Status Breakdown
  addSectionHeader('2. Package Status Breakdown');

  const statusHeader = sheet2.getRow(currRow);
  statusHeader.getCell(2).value = 'Package Status';
  statusHeader.getCell(3).value = 'Count';
  statusHeader.getCell(4).value = '% of Total';
  statusHeader.getCell(5).value = 'Total COD (Rs.)';
  statusHeader.getCell(6).value = 'Delivery Fee (Rs.)';

  [2, 3, 4, 5, 6].forEach(col => {
    const c = statusHeader.getCell(col);
    c.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    c.border = { bottom: { style: 'medium', color: { argb: 'FF0F172A' } } };
    c.alignment = col >= 3 ? { horizontal: 'right' } : { horizontal: 'left' };
  });
  currRow++;

  const statusMap = {};
  packages.forEach(p => {
    const st = p.status || 'Unknown';
    if (!statusMap[st]) {
      statusMap[st] = { count: 0, amount: 0, fee: 0 };
    }
    statusMap[st].count += 1;
    statusMap[st].amount += (p.amount || 0);
    statusMap[st].fee += (p.deliveryCharge || 0);
  });

  const totalPkgCount = packages.length || 1;
  Object.keys(statusMap).sort().forEach(status => {
    const data = statusMap[status];
    const r = sheet2.getRow(currRow);
    r.getCell(2).value = status;
    r.getCell(3).value = data.count;
    r.getCell(4).value = data.count / totalPkgCount;
    r.getCell(4).numFmt = '0.0%';
    r.getCell(5).value = data.amount;
    r.getCell(5).numFmt = 'Rs. #,##0.00';
    r.getCell(6).value = data.fee;
    r.getCell(6).numFmt = 'Rs. #,##0.00';

    [2, 3, 4, 5, 6].forEach(col => {
      const c = r.getCell(col);
      c.font = { name: 'Arial', size: 9.5 };
      c.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      if (col >= 3) c.alignment = { horizontal: 'right' };

    });
    currRow++;
  });
  currRow += 2;

  // Section 3: Vendor Breakdown
  addSectionHeader('3. Vendor Performance & Settlement Summary');

  const vendorHeader = sheet2.getRow(currRow);
  vendorHeader.getCell(2).value = 'Vendor Name';
  vendorHeader.getCell(3).value = 'Total Orders';
  vendorHeader.getCell(4).value = 'Delivered';
  vendorHeader.getCell(5).value = 'COD Amount (Rs.)';
  vendorHeader.getCell(6).value = 'Pending Payable (Rs.)';

  [2, 3, 4, 5, 6].forEach(col => {
    const c = vendorHeader.getCell(col);
    c.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    c.border = { bottom: { style: 'medium', color: { argb: 'FF0F172A' } } };
    c.alignment = col >= 3 ? { horizontal: 'right' } : { horizontal: 'left' };
  });
  currRow++;

  const vendorMap = {};
  packages.forEach(p => {
    const vName = p.vendorId?.vendorMeta?.shopName || p.vendorId?.name || 'Unspecified Vendor';
    if (!vendorMap[vName]) {
      vendorMap[vName] = { total: 0, delivered: 0, cod: 0, pending: 0 };
    }
    vendorMap[vName].total += 1;
    if (p.status === 'Delivered') {
      vendorMap[vName].delivered += 1;
      vendorMap[vName].cod += (p.amount || 0);
      if (!p.vendorPaid) {
        vendorMap[vName].pending += (p.vendorReceivable || 0);
      }
    }
  });

  Object.keys(vendorMap).sort().forEach(vName => {
    const v = vendorMap[vName];
    const r = sheet2.getRow(currRow);
    r.getCell(2).value = vName;
    r.getCell(3).value = v.total;
    r.getCell(4).value = v.delivered;
    r.getCell(5).value = v.cod;
    r.getCell(5).numFmt = 'Rs. #,##0.00';
    r.getCell(6).value = v.pending;
    r.getCell(6).numFmt = 'Rs. #,##0.00';

    [2, 3, 4, 5, 6].forEach(col => {
      const c = r.getCell(col);
      c.font = { name: 'Arial', size: 9.5 };
      c.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      if (col >= 3) c.alignment = { horizontal: 'right' };
    });
    currRow++;
  });

  return workbook;
};
