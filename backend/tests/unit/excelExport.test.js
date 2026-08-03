import { buildDailyExcelWorkbook } from '../../utils/excelExport.js';

describe('Excel Export Utility (2-Sheet Workbook)', () => {
  const mockPackages = [
    {
      _id: 'pkg1',
      trackingCode: 'KTM-1001',
      invoiceId: 'INV-1001',
      vendorId: { name: 'Vendor One', vendorMeta: { shopName: 'Shop Alpha' } },
      customerName: 'Alice Smith',
      customerPhone: '9800000001',
      address: 'New Road, Kathmandu',
      city: 'Kathmandu',
      outOfValley: false,
      weight: 1.5,
      amount: 1500,
      deliveryCharge: 120,
      vendorReceivable: 1380,
      status: 'Delivered',
      riderId: { name: 'Rider Bob' },
      settlementStatus: 'Settled',
      codVerified: true,
      vendorPaid: true,
      deliveryDate: new Date('2026-07-28T10:00:00Z'),
      createdAt: new Date('2026-07-28T08:00:00Z'),
      updatedAt: new Date('2026-07-28T10:00:00Z'),
    },
    {
      _id: 'pkg2',
      trackingCode: 'KTM-1002',
      invoiceId: 'INV-1002',
      vendorId: { name: 'Vendor Two', vendorMeta: { shopName: 'Shop Beta' } },
      customerName: 'Charlie Brown',
      customerPhone: '9800000002',
      address: 'Lakeside, Pokhara',
      city: 'Pokhara',
      outOfValley: true,
      weight: 2.0,
      amount: 2500,
      deliveryCharge: 250,
      vendorReceivable: 2250,
      status: 'Delivered',
      riderId: { name: 'Rider Bob' },
      settlementStatus: 'Verified',
      codVerified: true,
      vendorPaid: false,
      deliveryDate: new Date('2026-07-28T11:00:00Z'),
      createdAt: new Date('2026-07-28T08:30:00Z'),
      updatedAt: new Date('2026-07-28T11:00:00Z'),
    },
    {
      _id: 'pkg3',
      trackingCode: 'KTM-1003',
      invoiceId: 'INV-1003',
      vendorId: { name: 'Vendor One', vendorMeta: { shopName: 'Shop Alpha' } },
      customerName: 'Dave Miller',
      customerPhone: '9800000003',
      address: 'Patan, Lalitpur',
      city: 'Lalitpur',
      outOfValley: false,
      weight: 0.5,
      amount: 800,
      deliveryCharge: 100,
      vendorReceivable: 700,
      status: 'Out for Delivery',
      riderId: { name: 'Rider Sam' },
      settlementStatus: 'Pending',
      codVerified: false,
      vendorPaid: false,
      createdAt: new Date('2026-07-28T09:00:00Z'),
      updatedAt: new Date('2026-07-28T09:00:00Z'),
    }
  ];

  const mockExpenses = [
    { _id: 'exp1', amount: 300, date: new Date('2026-07-28'), category: 'Fuel' },
    { _id: 'exp2', amount: 150, date: new Date('2026-07-28'), category: 'Maintenance' },
  ];

  it('should generate a workbook containing exactly 2 sheets', async () => {
    const workbook = await buildDailyExcelWorkbook({
      packages: mockPackages,
      expenses: mockExpenses,
      dateStr: '2026-07-28'
    });

    expect(workbook).toBeDefined();
    expect(workbook.worksheets.length).toBe(2);
    expect(workbook.worksheets[0].name).toBe('Packages Detail');
    expect(workbook.worksheets[1].name).toBe('Daily Summary & Financials');
  });

  it('should format Sheet 1 (Packages Detail) with correct headers, rows, and total formulas', async () => {
    const workbook = await buildDailyExcelWorkbook({
      packages: mockPackages,
      expenses: mockExpenses,
      dateStr: '2026-07-28'
    });

    const sheet1 = workbook.getWorksheet('Packages Detail');

    // Title banner
    expect(sheet1.getCell('A1').value).toContain('KTMEXPRESS LOGISTICS');
    expect(sheet1.getCell('A1').value).toContain('2026-07-28');

    // Header row (Row 2)
    expect(sheet1.getCell('A2').value).toBe('S.N.');
    expect(sheet1.getCell('B2').value).toBe('Tracking Code');
    expect(sheet1.getCell('K2').value).toBe('COD Amount (Rs.)');

    // Data rows (Rows 3 to 5)
    expect(sheet1.getCell('B3').value).toBe('KTM-1001');
    expect(sheet1.getCell('D3').value).toBe('Shop Alpha');
    expect(sheet1.getCell('K3').value).toBe(1500);

    expect(sheet1.getCell('B4').value).toBe('KTM-1002');
    expect(sheet1.getCell('D4').value).toBe('Shop Beta');
    expect(sheet1.getCell('K4').value).toBe(2500);

    // Summary formula row (Row 6)
    const summaryRow = sheet1.getRow(6);
    expect(summaryRow.getCell(1).value).toBe('TOTAL');
    expect(summaryRow.getCell(11).value).toEqual({ formula: 'SUM(K3:K5)' });
    expect(summaryRow.getCell(12).value).toEqual({ formula: 'SUM(L3:L5)' });
    expect(summaryRow.getCell(13).value).toEqual({ formula: 'SUM(M3:M5)' });
  });

  it('should format Sheet 2 (Daily Summary & Financials) with metrics and breakdown tables', async () => {
    const workbook = await buildDailyExcelWorkbook({
      packages: mockPackages,
      expenses: mockExpenses,
      dateStr: '2026-07-28'
    });

    const sheet2 = workbook.getWorksheet('Daily Summary & Financials');
    expect(sheet2.getCell('B1').value).toContain('DAILY SUMMARY & FINANCIAL RECONCILIATION');

    // Export buffer validation
    const buffer = await workbook.xlsx.writeBuffer();
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(0);
  });
});
