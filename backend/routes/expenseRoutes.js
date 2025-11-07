const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const expenseController = require('../controllers/expenseController');

// GET /api/expenses - Get all expenses for logged-in user
router.get('/', verifyToken, expenseController.getExpenses);

// POST /api/expenses - Add new expense/income
router.post('/', verifyToken, expenseController.addExpense);

// DELETE /api/expenses/:id - Delete specific expense
router.delete('/:id', verifyToken, expenseController.deleteExpense);

module.exports = router;