import express from 'express';
import cors from 'cors';
import pg from 'pg';
const { Pool } = pg;

const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: 'postgresql://mtn-momo-analysis%20_owner:npg_bYvWy0SNG6rC@ep-orange-moon-a9a9cbk5-pooler.gwc.azure.neon.tech/mtn-momo-analysis%20?sslmode=require'
});

// Get all transactions with optional filtering
router.get('/transactions', async (req, res) => {
  try {
    const { 
      type, 
      startDate, 
      endDate, 
      minAmount, 
      maxAmount,
      page = 1,
      limit = 50,
      sortBy = 'date',
      sortOrder = 'DESC'
    } = req.query;

    let query = 'SELECT * FROM transactions WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (type) {
      query += ` AND type = $${paramCount}`;
      values.push(type);
      paramCount++;
    }

    if (startDate) {
      query += ` AND date >= $${paramCount}`;
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND date <= $${paramCount}`;
      values.push(endDate);
      paramCount++;
    }

    if (minAmount) {
      query += ` AND amount >= $${paramCount}`;
      values.push(minAmount);
      paramCount++;
    }

    if (maxAmount) {
      query += ` AND amount <= $${paramCount}`;
      values.push(maxAmount);
      paramCount++;
    }

    // Add sorting
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    
    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM transactions WHERE 1=1${query.split('ORDER BY')[0].split('WHERE')[1]}`;
    const countResult = await pool.query(countQuery, values.slice(0, -2));
    
    res.json({
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction statistics
router.get('/statistics', async (req, res) => {
  try {
    const stats = await pool.query('SELECT * FROM transaction_stats');
    const monthly = await pool.query('SELECT * FROM monthly_summaries');
    
    res.json({
      overall: stats.rows,
      monthly: monthly.rows
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction details by ID
router.get('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction types
router.get('/transaction-types', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT enum_range(NULL::transaction_type)::text[] as types
    `);
    res.json(result.rows[0].types);
  } catch (error) {
    console.error('Error fetching transaction types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 