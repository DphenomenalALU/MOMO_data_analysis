import express from 'express'
import pg from 'pg'
import env from 'dotenv'
import * as utils from './util.js'

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

db.connect()
.then(() => console.log('server.js Connected to DB'))
.catch(err => console.error('server.js DB connection error', err));

app.use(express.urlencoded({ extended: true }));


app.get('/', async (req, res) => {
  res.send('Hello')
  await utils.getIncome();
  await utils.getDeposite();
  await utils.getCodePayment();
  await utils.getTransferred();
  await utils.getThirdParty();
  await utils.getPowerBill();
  await utils.getBundles();
  await utils.getAirtime();
  await utils.getBankTransfer();
  await utils.getinternetBundle();
  await utils.getWithdrawn();


  // console.log(utils.airtime)
  console.log("Internet Bundles: ",utils.internetBundle.length)
  console.log("Withdrawals from an Agent: ",utils.withdrawal.length)
  console.log("Bank transfers : ",utils.bankTransfer.length)
  console.log("Airtime: ",utils.airtime.length)
  console.log("Bundles: ",utils.bundles.length)
  console.log("MTN cash power bill payment: ",utils.cashPowerBill.length)
  console.log("Third party initiated transfers: ",utils.thirdPartyInitiated.length)
  console.log("Mobile transferred money",utils.transferredMoney.length)
  console.log("Payment to Code Holders",utils.codePayment.length)
  console.log("Bank deposit transactions",utils.bankDeposite.length)
  console.log("Incoming Money",utils.incomingMoney.length)

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

// tst()
