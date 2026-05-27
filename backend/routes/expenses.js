const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/auth');

// Protect all expense routes with authentication
router.use(authMiddleware.verifyToken);

// Routes
router.post('/add', expenseController.addExpense);
router.get('/all', expenseController.getExpenses);
router.get('/category/:category', expenseController.getExpensesByCategory);
router.delete('/:expenseId', expenseController.deleteExpense);
router.get('/summary', expenseController.getMonthlySummary);

module.exports = router;