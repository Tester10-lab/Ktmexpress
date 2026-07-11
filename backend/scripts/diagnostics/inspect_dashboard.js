import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import User from '../models/User.js';
import Package from '../models/Package.js';
import Expense from '../models/Expense.js';

async function run() {
  const mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  console.log('In-Memory MongoDB Server started:', mongoUri);
  await mongoose.connect(mongoUri);

  // 1. Seed some mock data
  const rider = await User.create({ name: 'Rider Harry', role: 'rider', email: 'rider@example.com', password: 'password', status: 'Active' });
  const vendor = await User.create({ name: 'Vendor Shop', role: 'vendor', email: 'vendor@example.com', password: 'password', status: 'Active' });

  // Delivered packages (reconciled and not reconciled, vendor paid and not vendor paid)
  await Package.create({
    trackingCode: 'TRK-001',
    invoiceId: 'INV-001',
    customerName: 'Customer 1',
    customerPhone: '9800000000',
    address: 'Kathmandu',
    amount: 1500,
    deliveryCharge: 150,
    vendorReceivable: 1350,
    status: 'Delivered',
    riderId: rider._id,
    vendorId: vendor._id,
    codVerified: true,
    vendorPaid: false,
    updatedAt: new Date()
  });

  await Package.create({
    trackingCode: 'TRK-002',
    invoiceId: 'INV-002',
    customerName: 'Customer 2',
    customerPhone: '9800000000',
    address: 'Kathmandu',
    amount: 2500,
    deliveryCharge: 150,
    vendorReceivable: 2350,
    status: 'Delivered',
    riderId: rider._id,
    vendorId: vendor._id,
    codVerified: false,
    vendorPaid: true,
    updatedAt: new Date()
  });

  // Out for Delivery
  await Package.create({
    trackingCode: 'TRK-003',
    invoiceId: 'INV-003',
    customerName: 'Customer 3',
    customerPhone: '9800000000',
    address: 'Kathmandu',
    amount: 1000,
    deliveryCharge: 150,
    vendorReceivable: 850,
    status: 'Out for Delivery',
    riderId: rider._id,
    vendorId: vendor._id
  });

  // Run the aggregation
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [pkgStats] = await Package.aggregate([
    { $match: { deletedAt: null } },
    {
      $facet: {
        total: [{ $count: 'count' }],
        delivered: [{ $match: { status: 'Delivered' } }, { $count: 'count' }],
        pending: [{ $match: { status: { $in: ['Pending', 'Pick Up Requested', 'Picked Up', 'In Warehouse'] } } }, { $count: 'count' }],
        outForDelivery: [{ $match: { status: 'Out for Delivery' } }, { $count: 'count' }],
        cancelled: [{ $match: { status: 'Cancelled' } }, { $count: 'count' }],
        returned: [{ $match: { status: { $in: ['Returned', 'Returned to Vendor'] } } }, { $count: 'count' }],
        todayPackages: [{ $match: { createdAt: { $gte: today } } }, { $count: 'count' }],
        monthPackages: [{ $match: { createdAt: { $gte: monthStart } } }, { $count: 'count' }],
        todayDeliveries: [{ $match: { status: 'Delivered', updatedAt: { $gte: today } } }, { $count: 'count' }],
        deliveredRevenue: [
          { $match: { status: 'Delivered' } },
          { $group: { _id: null, totalCOD: { $sum: '$amount' }, totalCharges: { $sum: '$deliveryCharge' }, totalVendorReceivable: { $sum: '$vendorReceivable' } } }
        ],
        todayCOD: [
          { $match: { status: 'Delivered', updatedAt: { $gte: today } } },
          { $group: { _id: null, collected: { $sum: '$amount' } } }
        ],
        codPending: [
          { $match: { status: 'Delivered', codVerified: { $ne: true } } },
          { $group: { _id: null, amount: { $sum: '$amount' } } }
        ],
        vendorPayable: [
          { $match: { status: 'Delivered', vendorPaid: { $ne: true } } },
          { $group: { _id: null, amount: { $sum: '$vendorReceivable' } } }
        ]
      }
    }
  ]);

  const c = (arr) => arr[0]?.count || 0;
  const g = (arr, field) => arr[0]?.[field] || 0;

  const activeVendors = await User.countDocuments({ role: 'vendor', status: 'Active' });
  const activeRiders = await User.countDocuments({ role: 'rider', status: 'Active' });
  const todayExpenses = await Expense.countDocuments({ status: 'Pending', date: { $gte: today } });

  const data = {
    totalPackages: c(pkgStats.total),
    todayPackages: c(pkgStats.todayPackages),
    monthPackages: c(pkgStats.monthPackages),
    delivered: c(pkgStats.delivered),
    pending: c(pkgStats.pending),
    outForDelivery: c(pkgStats.outForDelivery),
    cancelled: c(pkgStats.cancelled),
    returned: c(pkgStats.returned),
    todayDeliveries: c(pkgStats.todayDeliveries),
    todayExpenses,
    activeVendors,
    activeRiders,
    totalRevenue: g(pkgStats.deliveredRevenue, 'totalCOD'),
    totalDeliveryCharges: g(pkgStats.deliveredRevenue, 'totalCharges'),
    profit: g(pkgStats.deliveredRevenue, 'totalCharges'),
    vendorPayable: g(pkgStats.vendorPayable, 'amount'),
    todayCOD: g(pkgStats.todayCOD, 'collected'),
    codPending: g(pkgStats.codPending, 'amount'),
  };

  console.log('AGGREGATION PIECES:');
  console.log('deliveredRevenue:', pkgStats.deliveredRevenue);
  console.log('todayCOD:', pkgStats.todayCOD);
  console.log('codPending:', pkgStats.codPending);
  console.log('vendorPayable:', pkgStats.vendorPayable);
  console.log('FINAL PROCESSED DATA:', JSON.stringify(data, null, 2));

  await mongoose.disconnect();
  await mongod.stop();
  process.exit(0);
}

run().catch(console.error);
