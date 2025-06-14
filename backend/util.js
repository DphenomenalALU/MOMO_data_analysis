import pg from 'pg'
import env from 'dotenv'

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
.then(() => console.log('util.js Connected to DB'))
.catch(err => console.error('util.js DB connection error', err));

let incomingMoney;
let bankDeposite;
let codePayment;
let transferredMoney;
let thirdPartyInitiated;
let cashPowerBill;
let bundles;
let airtime;
let withdrawal;
let bankTransfer;
let internetBundle;

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



// A function that filters the database for messages indicating receiving money and returrns an arrray of those messages
async function getIncome() {
  try {
    const result = await db.query(
      "SELECT * FROM sms_info WHERE body LIKE '%' || 'You have received' || '%';",
    )
    incomingMoney = result.rows

  } catch (error) {
    console.log('error finding data: ', error)
  }
  return incomingMoney 
}

// A function that filters the database for messages indicating a bank deposite and returrns an arrray of those messages
async function getDeposite() {
  try {
    const result = await db.query(
      "SELECT * FROM sms_info WHERE body LIKE '%' || 'A bank' || '%';",
    )
    bankDeposite = result.rows

  } catch (error) {
    console.log('error finding data: ', error)
  }
  return bankDeposite
}

async function getCodePayment() {
  try {
    const result = await db.query(
      "SELECT * FROM sms_info WHERE body LIKE '%' || 'Your payment of' || '%';",
    )
    codePayment = result.rows

  } catch (error) {
    console.log('error finding data: ', error)
  }
  return codePayment
}

async function getTransferred() {
  try {
    const result = await db.query(
      "SELECT * FROM sms_info WHERE body LIKE '%' || 'transferred to' || '%';",
    )
    transferredMoney = result.rows

  } catch (error) {
    console.log('error finding data: ', error)
  }
  return transferredMoney
}

async function getThirdParty() {
  try {
    const result = await db.query(
      "SELECT * FROM sms_info WHERE body LIKE '%' || 'on your MOMO account' || '%';",
    )
   thirdPartyInitiated = result.rows

  } catch (error) {
    console.log('error finding data: ', error)
  }
  return thirdPartyInitiated
}

async function getPowerBill() {
  try {
    const result = await db.query(
      "SELECT * FROM sms_info WHERE body LIKE '%' || 'MTN Cash Power' || '%';",
    )
   cashPowerBill= result.rows

  } catch (error) {
    console.log('error finding data: ', error)
  }
  return cashPowerBill
}

async function getBundles() {
  try {
    const result = await db.query(
      "SELECT * FROM sms_info WHERE body LIKE '%' || 'MTN Cash Power' || '%';",
    )
   bundles = result.rows

  } catch (error) {
    console.log('error finding data: ', error)
  }
  return bundles
}

async function getAirtime() {
  try {
    const result = await db.query(
      "SELECT * FROM sms_info WHERE body LIKE '%' || 'Airtime with token' || '%';",
    )
   airtime = result.rows

  } catch (error) {
    console.log('error finding data: ', error)
  }
  return airtime
}

async function getWithdrawn() {
  try {
    const result = await db.query(
      "SELECT * FROM sms_info WHERE body LIKE '%' || 'withdrawn' || '%';",
    )
   withdrawal = result.rows

  } catch (error) {
    console.log('error finding data: ', error)
  }
  return withdrawal
}

async function getinternetBundle() {
  try {
    const result = await db.query(
      "SELECT * FROM sms_info WHERE body LIKE '%' || 'Yello!Umaze kugura' || '%';",
    )
   internetBundle= result.rows

  } catch (error) {
    console.log('error finding data: ', error)
  }
  return internetBundle
}

async function getBankTransfer() {
  try {
    const result = await db.query(
      "SELECT * FROM sms_info WHERE body LIKE '%' || 'You have transferred' || '%';",
    )
   bankTransfer= result.rows

  } catch (error) {
    console.log('error finding data: ', error)
  }
  return bankTransfer
}





export  {getIncome, getCodePayment, getBundles, getDeposite, getThirdParty,getPowerBill, getTransferred, getAirtime, getWithdrawn, getinternetBundle, getBankTransfer, incomingMoney, codePayment, cashPowerBill, bankDeposite, thirdPartyInitiated, bundles, transferredMoney, airtime, withdrawal, internetBundle, bankTransfer}