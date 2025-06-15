import express from 'express'
import pg from 'pg'
import env from 'dotenv'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { format, parseISO } from 'date-fns'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define transaction types to match the enum in schema.sql
const TRANSACTION_TYPES = {
    INCOMING_MONEY: 'INCOMING_MONEY',
    PAYMENT_TO_CODE: 'PAYMENT_TO_CODE',
    TRANSFER_TO_MOBILE: 'TRANSFER_TO_MOBILE',
    BANK_DEPOSIT: 'BANK_DEPOSIT',
    AIRTIME_PAYMENT: 'AIRTIME_PAYMENT',
    CASH_POWER: 'CASH_POWER',
    THIRD_PARTY: 'THIRD_PARTY',
    WITHDRAWAL: 'WITHDRAWAL',
    BANK_TRANSFER: 'BANK_TRANSFER',
    INTERNET_BUNDLE: 'INTERNET_BUNDLE',
    UNKNOWN: 'UNKNOWN'
};

const app = express();
const port = 3000;
env.config();

// Add initial data check
async function checkDatabaseData() {
    try {
        const countResult = await db.query('SELECT COUNT(*) FROM transactions');
        console.log('Total transactions in database:', countResult.rows[0].count);
        
        const typesResult = await db.query('SELECT type, COUNT(*) FROM transactions GROUP BY type');
        console.log('Transactions by type:', typesResult.rows);
    } catch (error) {
        console.error('Error checking database data:', error);
    }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

//Create pg instance using DATABASE_URL
const db = new pg.Client({
    connectionString: process.env.DATABASE_URL
});

db.connect()
.then(() => {
    console.log('server.js Connected to DB');
    checkDatabaseData(); // Check data after connection
})
.catch(err => console.error('server.js DB connection error', err));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 1. GET /transactions with filters
app.get('/api/transactions', async (req, res) => {
    try {
        const { type, date_from, date_to, min_amount, max_amount } = req.query;
        let query = "SELECT * FROM transactions WHERE 1=1";
        const values = [];
        let paramCount = 1;

        if (type && TRANSACTION_TYPES[type]) {
            query += ` AND type = $${paramCount}::transaction_type`;
            values.push(type);
            paramCount++;
        }

        if (date_from) {
            query += ` AND date >= $${paramCount}`;
            values.push(date_from);
            paramCount++;
        }

        if (date_to) {
            query += ` AND date <= $${paramCount}`;
            values.push(date_to);
            paramCount++;
        }

        if (min_amount) {
            query += ` AND amount >= $${paramCount}`;
            values.push(parseFloat(min_amount));
            paramCount++;
        }

        if (max_amount) {
            query += ` AND amount <= $${paramCount}`;
            values.push(parseFloat(max_amount));
            paramCount++;
        }

        query += " ORDER BY date DESC";  // Removed LIMIT
        console.log('Executing query:', query, 'with values:', values);
        const result = await db.query(query, values);
        console.log('Query result:', result.rows.length, 'rows');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
    }
});

// 2. GET /transactions/:id
app.get('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM transactions WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// 3. GET /stats/summary
app.get('/api/stats/summary', async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_volume,
        AVG(amount) as avg_amount,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount
      FROM transactions
    `;
    console.log('Executing summary query:', query);
    const result = await db.query(query);
    console.log('Summary result:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    res.status(500).json({ error: 'Failed to fetch summary statistics', details: error.message });
  }
});

// 4. GET /stats/monthly
app.get('/api/stats/monthly', async (req, res) => {
    try {
        const query = `
            SELECT 
                DATE_TRUNC('month', date) as month,
                COUNT(*) as transaction_count,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount,
                COUNT(DISTINCT type) as unique_types
            FROM transactions
            GROUP BY DATE_TRUNC('month', date)
            ORDER BY month DESC
        `;  // Removed LIMIT
        console.log('Executing monthly stats query:', query);
        const result = await db.query(query);
        
        const formattedResults = result.rows.map(row => ({
            ...row,
            month: format(row.month, 'yyyy-MM')
        }));
        
        console.log('Monthly stats result:', formattedResults.length, 'months');
        res.json(formattedResults);
    } catch (error) {
        console.error('Error fetching monthly stats:', error);
        res.status(500).json({ error: 'Failed to fetch monthly statistics', details: error.message });
    }
});

// 5. GET /transactions/types
app.get('/api/transactions/types', async (req, res) => {
  try {
    // Return the predefined transaction types
    res.json(Object.values(TRANSACTION_TYPES));
  } catch (error) {
    console.error('Error fetching transaction types:', error);
    res.status(500).json({ error: 'Failed to fetch transaction types' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`View the dashboard at http://localhost:${port}`);
});

async function tst() {

  try {
    const recieved = await db.query(
      "SELECT * FROM sms_info WHERE body LIKE '%' || 'You have received' || '%';",
    )
    console.log(recieved.rows);
    
  } catch (error) {
    console.log('error finding data: ', error)
  }
}

// tst()
