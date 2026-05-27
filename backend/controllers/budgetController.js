const pool = require('../config/database');

// Set budget limit for a category
exports.setBudgetLimit = async (req, res) => {
  try {
    const { category, limitAmount, month, year } = req.body;
    const userId = req.user.userId;

    if (!category || !limitAmount || !month || !year) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Check if limit already exists for this month/category
    const existing = await pool.query(
      'SELECT id FROM budget_limits WHERE user_id = $1 AND category = $2 AND month = $3 AND year = $4',
      [userId, category, month, year]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing limit
      result = await pool.query(
        'UPDATE budget_limits SET limit_amount = $1 WHERE user_id = $2 AND category = $3 AND month = $4 AND year = $5 RETURNING *',
        [limitAmount, userId, category, month, year]
      );
    } else {
      // Create new limit
      result = await pool.query(
        'INSERT INTO budget_limits (user_id, category, limit_amount, month, year) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, category, limitAmount, month, year]
      );
    }

    res.status(201).json({
      message: 'Budget limit set successfully',
      budget: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all budget limits for user
exports.getBudgetLimits = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, year } = req.query;

    let query = 'SELECT * FROM budget_limits WHERE user_id = $1';
    const params = [userId];

    if (month && year) {
      query += ' AND month = $2 AND year = $3';
      params.push(month, year);
    }

    const result = await pool.query(query, params);

    res.status(200).json({
      budgets: result.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if spending exceeds budget
exports.checkBudgetStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, year } = req.query;

    // Get all budget limits for this month
    const budgets = await pool.query(
      'SELECT * FROM budget_limits WHERE user_id = $1 AND month = $2 AND year = $3',
      [userId, month, year]
    );

    // Get actual spending by category for this month
    const spending = await pool.query(
      `SELECT category, SUM(amount) as total FROM expenses 
       WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3
       GROUP BY category`,
      [userId, month, year]
    );

    // Compare budgets with spending
    const status = budgets.rows.map((budget) => {
      const spent = spending.rows.find((s) => s.category === budget.category);
      const actualSpent = spent ? parseFloat(spent.total) : 0;
      const limitAmount = parseFloat(budget.limit_amount);
      const percentUsed = (actualSpent / limitAmount) * 100;

      return {
        category: budget.category,
        limit: limitAmount,
        spent: actualSpent,
        remaining: Math.max(0, limitAmount - actualSpent),
        percentUsed: Math.min(100, Math.round(percentUsed)),
        exceeded: actualSpent > limitAmount,
      };
    });

    res.status(200).json({
      status: status,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete budget limit
exports.deleteBudgetLimit = async (req, res) => {
  try {
    const { budgetId } = req.params;
    const userId = req.user.userId;

    // Verify the budget belongs to the user
    const checkResult = await pool.query(
      'SELECT user_id FROM budget_limits WHERE id = $1',
      [budgetId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Budget limit not found' });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query('DELETE FROM budget_limits WHERE id = $1', [budgetId]);

    res.status(200).json({ message: 'Budget limit deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
