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

let receivedMoney;

app.get('/', async (req, res) => {
  res.send('Hello')
  await countReceived()
  console.log(receivedMoney)
  console.log(receivedMoney.length)
  
});


// A function that filters the database for messages indicating receiving money and returrns an arrray of those messages
async function countReceived() {
  try {
    const result = await db.query(
      "SELECT * FROM sms_info WHERE body LIKE '%' || 'You have received' || '%';",
    )
    receivedMoney = result.rows

  } catch (error) {
    console.log('error finding data: ', error)
  }
  return receivedMoney 
}


// A function to test if there are aany dublicates in the db the number of records in the table is 1691 if the output is the same number then there are no dublicates
// async function testunique() {
//   try {
//     const uniqueValues = await db.query(
//       "SELECT DISTINCT body, date FROM sms_info"
//     )
//     console.log(uniqueValues.rows.length)
//   } catch (error) {
//     console.log('error finding data: ', error)
//   }
// }

// // testunique()







app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});