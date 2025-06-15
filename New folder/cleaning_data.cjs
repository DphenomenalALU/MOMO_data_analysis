const fs = require('fs');
const xml2js = require('xml2js');
const path = require('path');

// Util: Extract amount in RWF from a body string
function extractAmount(body) {
  const match = body.match(/([0-9][0-9,]*)\s*RWF/i);
  return match ? parseInt(match[1].replace(/,/g, ''), 10) : null;
}

// Util: Convert timestamp to ISO date string
function formatDate(timestamp) {
  const date = new Date(Number(timestamp));
  return isNaN(date.getTime()) ? null : date.toISOString();
}

// Categories
const categorized = {
  "Incoming Money": [],
  "Payments to Code Holders": [],
  "Transfers to Mobile Numbers": [],
  "Bank Deposits": [],
  "Airtime Bill Payments": [],
  "Cash Power Bill Payments": [],
  "Transactions Initiated by Third Parties": [],
  "Withdrawals from Agents": [],
  "Bank Transfers": [],
  "Internet and Voice Bundle Purchases": []
};

const uncategorized = []; // For unprocessed messages

// Step 1: Read and clean XML file
fs.readFile('modified_sms_v2.xml', 'utf8', (err, rawData) => {
  if (err) {
    console.error('❌ Failed to read XML:', err);
    return;
  }

  // Sanitize malformed XML content
  
   const cleanedData = rawData
  .replace(/<\?[\s\S]*?\?>/g, '')  // <--- Remove processing instructions here
  .replace(/<[^<>\s]+=.*?\/>/g, '') 
  .replace(/(\s\w+)=([^\s">]+)/g, '$1="$2"') 
  .replace(/&(?!(amp|lt|gt|apos|quot);)/g, '&amp;');

  // Step 2: Parse XML (non-strict mode)
  const parser = new xml2js.Parser({
     strict: false, 
     attrkey: '$',
    maxBufferLength:5000000000
    });

  parser.parseString(cleanedData, (err, result) => {
    if (err) {
      console.error('❌ Failed to parse XML:', err.message);
      return;
    }

    //  console.log('Parsed root keys:', Object.keys(result));
    //  console.log('Sample parsed object:', JSON.stringify(result, null, 2).slice(0, 1000)); // print first 1000 chars


    // Attempt to find SMS entries
   let smsList = [];

// Handle case when SMS is an array (multiple messages) or single object
if (result.SMS) {
  if (Array.isArray(result.SMS)) {
    smsList = result.SMS;
  } else {
    smsList = [result.SMS];
  }
} else {
  console.error('❌ Could not find SMS entries in parsed XML.');
  return;
}
    // Step 3: Process and categorize SMS messages
    smsList.forEach(sms => {
      const attrs = sms.$;
      const body = attrs?.BODY || '';
      const timestamp = attrs?.DATE || null;

      if (!body || !timestamp) {
        uncategorized.push({ reason: 'Missing body or timestamp', sms: attrs });
        return;
      }

      const normalized = {
        body,
        amount: extractAmount(body),
        date: formatDate(timestamp)
      };

      // Categorize by keywords in the body
      if (/you have received/i.test(body)) {
        categorized["Incoming Money"].push(normalized);
      } else if (/via agent:/i.test(body) || /withdrawn \d+/i.test(body)) {
        categorized["Withdrawals from Agents"].push(normalized);
      } else if (/bank deposit/i.test(body)) {
        categorized["Bank Deposits"].push(normalized);
      } else if (/to Airtime/i.test(body) || /\bAirtime\b/.test(body)) {
        categorized["Airtime Bill Payments"].push(normalized);
      } else if (/cash power/i.test(body)) {
        categorized["Cash Power Bill Payments"].push(normalized);
      } else if (/\bBundle\b/i.test(body)) {
        categorized["Internet and Voice Bundle Purchases"].push(normalized);
      } else if (/transferred to .*\(\d+\)/i.test(body)) {
        categorized["Transfers to Mobile Numbers"].push(normalized);
      } else if (/to .*holder.*\d+/i.test(body)) {
        categorized["Payments to Code Holders"].push(normalized);
      } else if (/initiated by third party/i.test(body)) {
        categorized["Transactions Initiated by Third Parties"].push(normalized);
      } else if (/transfer to your bank/i.test(body) || /bank account/i.test(body)) {
        categorized["Bank Transfers"].push(normalized);
      } else {
        uncategorized.push({ reason: 'No matching pattern', sms: normalized });
      }
//        } else {
//   console.log('Uncategorized body:', body);
//   uncategorized.push({ reason: 'No matching pattern', sms: normalized });
// }

    });

    // Step 4: Output
    const logPath = path.join(__dirname, 'uncategorized.log');
    fs.writeFileSync(logPath, JSON.stringify(uncategorized, null, 2));
    console.log('✅ Categorization complete.');
    console.log(`🧾 Uncategorized messages logged to: ${logPath}`);

    // Optional: print category summary
    Object.entries(categorized).forEach(([key, messages]) => {
      console.log(`📂 ${key}: ${messages.length} messages`);
    });
  });
});
