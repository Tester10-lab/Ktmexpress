import express from 'express';
const router = express.Router();
import auth from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';
import { 
  addExpense,
  getExpenseHistory,
  getExpenseSummary,
 } from '../controllers/expenseController.js';

// All routes require auth + rider role
router.use(auth, roleGuard('rider'));

router.post('/', addExpense);
router.get('/history', getExpenseHistory);
router.get('/summary', getExpenseSummary);

export default router;
