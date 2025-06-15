import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful!');
    console.log('Server time:', result.rows[0].now);
    
    // Check if our tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('\nExisting tables:', tables.rows.map(row => row.table_name));
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await pool.end();
  }
}

testConnection(); 