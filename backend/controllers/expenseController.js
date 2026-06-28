import Expense from '../models/Expense.js';
import Allowance from '../models/Allowance.js';

// POST /api/expenses
export const addExpense = async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;

    if (!category || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Category and amount are required.',
      });
    }

    const expense = await Expense.create({
      riderId: req.user._id,
      category,
      amount,
      description: description || '',
      date: date || new Date(),
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/expenses/history
export const getExpenseHistory = async (req, res) => {
  try {
    const riderId = req.user._id;
    const { period, page = 1, limit = 30 } = req.query;

    const filter = { riderId };

    // Filter by period
    const now = new Date();
    if (period === 'daily') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      filter.date = { $gte: start };
    } else if (period === 'weekly') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      filter.date = { $gte: start };
    } else if (period === 'monthly') {
      const start = new Date(now);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      filter.date = { $gte: start };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Expense.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: expenses,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/expenses/summary
export const getExpenseSummary = async (req, res) => {
  try {
    const riderId = req.user._id;
    const now = new Date();

    // Daily
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    // Weekly
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    // Monthly
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [dailyAgg, weeklyAgg, monthlyAgg] = await Promise.all([
      Expense.aggregate([
        { $match: { riderId: req.user._id, date: { $gte: dayStart } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { riderId: req.user._id, date: { $gte: weekStart } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { riderId: req.user._id, date: { $gte: monthStart } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
    ]);

    // Get allowance
    let allowance = await Allowance.findOne({ riderId });
    if (!allowance) {
      allowance = { dailyAllowance: 500, weeklyAllowance: 3000, monthlyAllowance: 12000 };
    }

    const sumAgg = (agg) => agg.reduce((sum, item) => sum + item.total, 0);

    res.json({
      success: true,
      data: {
        daily: { breakdown: dailyAgg, total: sumAgg(dailyAgg) },
        weekly: { breakdown: weeklyAgg, total: sumAgg(weeklyAgg) },
        monthly: { breakdown: monthlyAgg, total: sumAgg(monthlyAgg) },
        allowance,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
