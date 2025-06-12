import pg from 'pg'
import fs from 'fs'
import xml2js from 'xml2js'
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
db.connect();


async function populateDatabase(protocol, address, type, body, service_centre, date ) {

  const exist = await db.query(
    "SELECT * FROM sms_info"
  )

  if (exist.rows.length == 0) {
    try {
      await db.query(
          'INSERT INTO sms_info (protocol, address, typ, body, service_centre, date ) VALUES ($1, $2, $3, $4, $5, $6)',
          [protocol, address, type, body, service_centre, date ]
      );
    
    } catch (error) {
      console.log('error inserting data into database: ', error);
    }

    
  } else {
    console.log('database is already populated')
  }

}



const parser = new xml2js.Parser({ explicitArray: false });

fs.readFile('modified_sms_v2.xml', (err, data) => {
  if (err) {
    console.error('Error reading XML file:', err);
    return;
  }

  parser.parseString(data, (err, result) => {
    if (err) {
      console.error('Error parsing XML:', err);
      return;
    }
    result.smses.sms.forEach((sms) => {
      const protocol = sms.$.protocol  
      const address = sms.$.address
      const type =   sms.$.type
      const body =   sms.$.body
      const service_centre = sms.$.service_center
      const date = sms.$.readable_date

      // make sure your db is empty beffore you run this file
      populateDatabase(protocol, address, type, body, service_centre, date );

    });

    
  });
});

