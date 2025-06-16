import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupSchema() {
  try {
    const schema = fs.readFileSync('./src/schema.sql', 'utf8');
    const client = await db.connect();
    await client.query(schema);
    console.log('Schema successfully created!');
    client.release();
    await db.end();
  } catch (error) {
    console.error('Error setting up schema:', error.message);
  }
}

setupSchema(); 