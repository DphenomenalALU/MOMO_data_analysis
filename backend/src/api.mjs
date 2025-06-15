import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const app = express();
app.use(cors());
app.use(express.json());

// Get all transactions with pagination and filtering
app.get('/api/transactions', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            type,
            dateFrom,
            dateTo,
            minAmount,
            maxAmount,
            search
        } = req.query;

        const offset = (page - 1) * limit;
        const params = [];
        let whereClause = [];
        let paramCount = 1;

        if (type) {
            whereClause.push(`type = $${paramCount}`);
            params.push(type);
            paramCount++;
        }

        if (dateFrom) {
            whereClause.push(`date >= $${paramCount}`);
            params.push(dateFrom);
            paramCount++;
        }

        if (dateTo) {
            whereClause.push(`date <= $${paramCount}`);
            params.push(dateTo);
            paramCount++;
        }

        if (minAmount) {
            whereClause.push(`amount >= $${paramCount}`);
            params.push(minAmount);
            paramCount++;
        }

        if (maxAmount) {
            whereClause.push(`amount <= $${paramCount}`);
            params.push(maxAmount);
            paramCount++;
        }

        if (search) {
            whereClause.push(`(
                counterparty_number ILIKE $${paramCount} OR 
                counterparty_name ILIKE $${paramCount} OR 
                transaction_id ILIKE $${paramCount}
            )`);
            params.push(`%${search}%`);
            paramCount++;
        }

        const whereStatement = whereClause.length > 0 
            ? 'WHERE ' + whereClause.join(' AND ')
            : '';

        const query = `
            SELECT * FROM transactions 
            ${whereStatement}
            ORDER BY date DESC 
            LIMIT $${paramCount} 
            OFFSET $${paramCount + 1}
        `;
        
        params.push(limit, offset);

        const countQuery = `
            SELECT COUNT(*) 
            FROM transactions 
            ${whereStatement}
        `;

        const [data, count] = await Promise.all([
            pool.query(query, params),
            pool.query(countQuery, params.slice(0, -2))
        ]);

        res.json({
            data: data.rows,
            total: parseInt(count.rows[0].count),
            page: parseInt(page),
            totalPages: Math.ceil(parseInt(count.rows[0].count) / limit)
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get transaction statistics
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await pool.query('SELECT * FROM transaction_stats');
        res.json(stats.rows);
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get monthly summaries
app.get('/api/monthly-summary', async (req, res) => {
    try {
        const summaries = await pool.query(`
            SELECT * FROM monthly_summaries 
            ORDER BY month DESC, type
        `);
        res.json(summaries.rows);
    } catch (error) {
        console.error('Error fetching monthly summaries:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get transaction details by ID
app.get('/api/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM transactions WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching transaction details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get transaction distribution
app.get('/api/distribution', async (req, res) => {
    try {
        const result = await pool.query(`
            WITH ranges AS (
                SELECT 
                    CASE 
                        WHEN amount < 1000 THEN '0-999'
                        WHEN amount < 5000 THEN '1000-4999'
                        WHEN amount < 10000 THEN '5000-9999'
                        WHEN amount < 50000 THEN '10000-49999'
                        ELSE '50000+'
                    END as range,
                    COUNT(*) as count
                FROM transactions
                GROUP BY 1
            )
            SELECT * FROM ranges
            ORDER BY range;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching distribution:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});

export default app; 