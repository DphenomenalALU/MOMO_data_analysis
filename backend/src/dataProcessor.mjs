import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xml2js from 'xml2js';
import winston from 'winston';
import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configure logging
const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/unprocessed.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Transaction types enum
const TRANSACTION_TYPES = {
  INCOMING_MONEY: 'INCOMING_MONEY',
  PAYMENT_TO_CODE: 'PAYMENT_TO_CODE',
  TRANSFER_TO_MOBILE: 'TRANSFER_TO_MOBILE',
  BANK_DEPOSIT: 'BANK_DEPOSIT',
  AIRTIME_PAYMENT: 'AIRTIME_PAYMENT',
  CASH_POWER: 'CASH_POWER',
  THIRD_PARTY: 'THIRD_PARTY',
  WITHDRAWAL: 'WITHDRAWAL',
  BANK_TRANSFER: 'BANK_TRANSFER',
  INTERNET_BUNDLE: 'INTERNET_BUNDLE',
  UNKNOWN: 'UNKNOWN'
};

// Helper function to check if a message is an OTP
const isOTPMessage = (body) => {
  return body.includes('one-time password') && 
         body.includes('MTN MoMo') && 
         /\d{4}/.test(body);
};

// Helper function to extract amount from text
const extractAmount = (body) => {
  if (!body) return null;
  
  // Remove commas from numbers
  const cleanBody = body.replace(/,/g, '');
  
  // Try different amount patterns
  const patterns = [
    /(\d+)\s*RWF/i,
    /amount\s*:?\s*(\d+)/i,
    /transferred\s*(\d+)/i,
    /igura\s*(\d+)/i,
    /kugura\s*(\d+)Frw/i,
    /kugura\s*(\d+)FRW/i,
    /kugura\s*(\d+)Rwf/i
  ];

  for (const pattern of patterns) {
    const match = cleanBody.match(pattern);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }

  return null;
};

// Helper function to extract date from text
const extractDate = (body, fallbackDate) => {
  if (!body) {
    return fallbackDate ? new Date(parseInt(fallbackDate)) : new Date();
  }

  const patterns = [
    /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/,
    /at\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/,
    /on\s+(\d{4}-\d{2}-\d{2})/
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      const parsedDate = new Date(match[1]);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
  }

  // If no valid date found in body, try to use fallback
  if (fallbackDate) {
    const timestamp = parseInt(fallbackDate);
    if (!isNaN(timestamp)) {
      return new Date(timestamp);
    }
  }

  // If all else fails, return current date
  return new Date();
};

// Helper function to extract transaction ID
const extractTransactionId = (body) => {
  if (!body) return null;

  const patterns = [
    /Transaction Id:?\s*(\d+)/i,
    /TxId:?\s*(\d+)/i,
    /Financial Transaction Id:\s*(\d+)/i
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

// Helper function to extract counterparty (sender/receiver)
const extractCounterparty = (body) => {
  if (!body) return null;

  const patterns = [
    /to\s+([^(]+)\s*\((\d+)\)/i,
    /from\s+([^(]+)\s*\((\d+)\)/i,
    /Receiver:\s*(\d+)/i,
    /Sender:\s*(\d+)/i
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) {
      // If we have both name and number
      if (match[2]) {
        return {
          name: match[1].trim(),
          number: match[2]
        };
      }
      // If we only have a number
      return {
        name: null,
        number: match[1]
      };
    }
  }

  return null;
};

// Helper function to categorize transaction type
const categorizeTransaction = (body) => {
  if (!body) return TRANSACTION_TYPES.UNKNOWN;

  // Define patterns for each transaction type
  const patterns = {
    [TRANSACTION_TYPES.INCOMING_MONEY]: /received.*from|deposited.*into/i,
    [TRANSACTION_TYPES.PAYMENT_TO_CODE]: /payment.*to.*code|paid.*to/i,
    [TRANSACTION_TYPES.TRANSFER_TO_MOBILE]: /transferred.*to.*\d+|sent.*to/i,
    [TRANSACTION_TYPES.BANK_DEPOSIT]: /bank.*deposit|deposited.*bank/i,
    [TRANSACTION_TYPES.AIRTIME_PAYMENT]: /airtime|recharge/i,
    [TRANSACTION_TYPES.CASH_POWER]: /cash.*power|electricity/i,
    [TRANSACTION_TYPES.THIRD_PARTY]: /initiated.*by|authorized.*by/i,
    [TRANSACTION_TYPES.WITHDRAWAL]: /withdrawn|withdrawal/i,
    [TRANSACTION_TYPES.BANK_TRANSFER]: /bank.*transfer|imbank\.bank/i,
    [TRANSACTION_TYPES.INTERNET_BUNDLE]: /internet|bundle|kugura|data.*bundle|voice.*bundle/i
  };

  // Check each pattern
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(body)) {
      return type;
    }
  }

  return TRANSACTION_TYPES.UNKNOWN;
};

class DataProcessor {
  constructor() {
    this.processedCount = 0;
    this.ignoredCount = 0;
    this.batchSize = 100;
  }

  async processXMLFile(filePath) {
    try {
      // Read and parse XML file
      const xmlData = fs.readFileSync(filePath, 'utf8');
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xmlData);
      const messages = result.smses.sms;

      console.log(`Starting to process ${messages.length} messages...`);

      // Process messages in batches
      for (let i = 0; i < messages.length; i += this.batchSize) {
        const batch = messages.slice(i, i + this.batchSize);
        await this.processBatch(batch);
        console.log(`Processed ${Math.min(i + this.batchSize, messages.length)} of ${messages.length} messages`);
      }

      // Log final statistics
      const stats = {
        processed: this.processedCount,
        ignored: this.ignoredCount,
        total: messages.length,
        timestamp: new Date().toISOString()
      };

      fs.writeFileSync(
        path.join(__dirname, '../logs/processing-stats.json'),
        JSON.stringify(stats, null, 2)
      );

      console.log('\nProcessing complete:', stats);
      return stats;

    } catch (error) {
      console.error('Error processing XML file:', error);
      throw error;
    }
  }

  async processBatch(messages) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const batchPromises = messages.map(message => this.processMessage(message.$, client));
      const results = await Promise.allSettled(batchPromises);

      await client.query('COMMIT');

      // Count successes and failures
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          this.processedCount++;
        } else {
          this.ignoredCount++;
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing batch:', error);
    } finally {
      client.release();
    }
  }

  async processMessage(sms, client) {
    try {
      const body = sms.body || '';

      // Skip OTP messages
      if (isOTPMessage(body)) {
        logger.info({
          message: 'Skipped OTP message',
          timestamp: new Date().toISOString(),
          transaction: { body }
        });
        return false;
      }

      // Extract transaction details
      const type = categorizeTransaction(body);
      const amount = extractAmount(body);
      const date = extractDate(body, sms.date);
      const transactionId = extractTransactionId(body);
      const counterparty = extractCounterparty(body);

      // Validate required fields
      const errors = [];
      if (!amount) errors.push('Missing or invalid amount');

      if (errors.length > 0) {
        logger.warn({
          message: 'Invalid transaction',
          timestamp: new Date().toISOString(),
          transaction: {
            type,
            date: date.toISOString(),
            amount,
            body,
            address: sms.address,
            protocol: sms.protocol,
            service_center: sms.service_center,
            counterparty: counterparty?.number || null
          },
          errors
        });
        return false;
      }

      // Insert into database
      const query = `
        INSERT INTO transactions (
          type, amount, date, body, address, protocol,
          service_center, counterparty_number, counterparty_name,
          transaction_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `;

      const values = [
        type,
        amount,
        date,
        body,
        sms.address,
        sms.protocol,
        sms.service_center,
        counterparty?.number || null,
        counterparty?.name || null,
        transactionId
      ];

      await client.query(query, values);
      return true;

    } catch (error) {
      logger.error({
        message: 'Error processing message',
        timestamp: new Date().toISOString(),
        error: error.message,
        transaction: {
          body: sms.body,
          address: sms.address,
          protocol: sms.protocol,
          service_center: sms.service_center
        }
      });
      return false;
    }
  }
}

export { DataProcessor }; 