const pool = require('../config/database');

// Add new expense
exports.addExpense = async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;
    const userId = req.user.userId;

    if (!amount || !category || !date) {
      return res.status(400).json({ error: 'Amount, category, and date required' });
    }

    const result = await pool.query(
      'INSERT INTO expenses (user_id, amount, category, description, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, amount, category, description, date]
    );

    res.status(201).json({
      message: 'Expense added successfully',
      expense: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all expenses for user
exports.getExpenses = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );

    res.status(200).json({
      expenses: result.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get expenses by category
exports.getExpensesByCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { category } = req.params;

    const result = await pool.query(
      'SELECT * FROM expenses WHERE user_id = $1 AND category = $2 ORDER BY date DESC',
      [userId, category]
    );

    res.status(200).json({
      expenses: result.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user.userId;

    // Verify the expense belongs to the user
    const checkResult = await pool.query(
      'SELECT user_id FROM expenses WHERE id = $1',
      [expenseId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query('DELETE FROM expenses WHERE id = $1', [expenseId]);

    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get monthly summary
exports.getMonthlySummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, year } = req.query;

    const result = await pool.query(
      `SELECT category, SUM(amount) as total FROM expenses 
       WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
       GROUP BY category`,
      [userId, month, year]
    );

    res.status(200).json({
      summary: result.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};