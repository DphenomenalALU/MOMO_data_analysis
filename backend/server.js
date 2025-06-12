import express from 'express'
import pg, { Result } from 'pg'
import env from 'dotenv'

const app = express();
const port = 3000;
env.config();

//Create pg instance
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
  res.send('Hello')

  
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
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

tst()