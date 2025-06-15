import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

async function verifyData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('Verifying imported data...\n');

    // Get total count
    const totalCount = await pool.query('SELECT COUNT(*) FROM transactions');
    console.log('Total transactions:', totalCount.rows[0].count);

    // Get counts by type
    const typeCounts = await pool.query(`
      SELECT type, COUNT(*) as count, 
             MIN(amount) as min_amount, 
             MAX(amount) as max_amount,
             AVG(amount) as avg_amount
      FROM transactions 
      GROUP BY type 
      ORDER BY count DESC
    `);
    
    console.log('\nTransactions by type:');
    console.table(typeCounts.rows);

    // Get date range
    const dateRange = await pool.query(`
      SELECT 
        MIN(date) as earliest_transaction,
        MAX(date) as latest_transaction
      FROM transactions
    `);
    console.log('\nDate range:');
    console.log('Earliest:', dateRange.rows[0].earliest_transaction);
    console.log('Latest:', dateRange.rows[0].latest_transaction);

    // Sample of each transaction type
    console.log('\nSample transactions for each type:');
    for (const row of typeCounts.rows) {
      const sample = await pool.query(`
        SELECT * FROM transactions 
        WHERE type = $1 
        ORDER BY date DESC 
        LIMIT 1
      `, [row.type]);
      
      if (sample.rows[0]) {
        console.log(`\n${row.type}:`);
        console.log('- Amount:', sample.rows[0].amount);
        console.log('- Date:', sample.rows[0].date);
        console.log('- Body:', sample.rows[0].body);
      }
    }

  } catch (error) {
    console.error('Error verifying data:', error);
  } finally {
    await pool.end();
  }
}

verifyData(); 