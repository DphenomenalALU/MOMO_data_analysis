import express from 'express'
import pg from 'pg'
import env from 'dotenv'
import * as utils from './util.js'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express();
const port = 3000;
env.config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

//Create pg instance
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

db.connect()
.then(() => console.log('server.js Connected to DB'))
.catch(err => console.error('server.js DB connection error', err));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// API endpoints
app.get('/api/transactions', async (req, res) => {
  try {
    // TODO: Implement filters from req.query
    const transactions = await utils.getAllTransactions();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const stats = {
      totalTransactions: await utils.getTotalTransactions(),
      totalVolume: await utils.getTotalVolume(),
      averageTransaction: await utils.getAverageTransaction()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/trends/monthly', async (req, res) => {
  try {
    const trends = {
      monthly: await utils.getMonthlyTrends(),
      byType: await utils.getTransactionsByType()
    };
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trends' });
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
