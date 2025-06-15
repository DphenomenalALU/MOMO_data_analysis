import fs from 'fs';
import xml2js from 'xml2js';
import winston from 'winston';
import { format } from 'date-fns';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configure logging - only for unprocessed messages
const logger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/unprocessed.log',
      format: winston.format.printf(({ timestamp, message, sms }) => {
        return `${timestamp} - ${message}\nSMS Content: ${sms?.$.body || 'N/A'}\n`;
      })
    })
  ]
});

// Transaction Categories
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

// Database connection
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Regular expressions for transaction categorization
const transactionPatterns = {
  [TRANSACTION_TYPES.INCOMING_MONEY]: /You have received (\d+(?:,\d+)?)\s*RWF from (.+?)\./i,
  [TRANSACTION_TYPES.PAYMENT_TO_CODE]: /Your payment of (\d+(?:,\d+)?)\s*RWF to (.+?) has been completed/i,
  [TRANSACTION_TYPES.TRANSFER_TO_MOBILE]: /transferred to (.+?) (\d+(?:,\d+)?)\s*RWF/i,
  [TRANSACTION_TYPES.BANK_DEPOSIT]: /A bank deposit of (\d+(?:,\d+)?)\s*RWF/i,
  [TRANSACTION_TYPES.AIRTIME_PAYMENT]: /Airtime.*?(\d+(?:,\d+)?)\s*RWF/i,
  [TRANSACTION_TYPES.CASH_POWER]: /MTN Cash Power.*?(\d+(?:,\d+)?)\s*RWF/i,
  [TRANSACTION_TYPES.THIRD_PARTY]: /on your MOMO account.*?(\d+(?:,\d+)?)\s*RWF/i,
  [TRANSACTION_TYPES.WITHDRAWAL]: /withdrawn (\d+(?:,\d+)?)\s*RWF/i,
  [TRANSACTION_TYPES.BANK_TRANSFER]: /transferred to Bank.*?(\d+(?:,\d+)?)\s*RWF/i,
  [TRANSACTION_TYPES.INTERNET_BUNDLE]: /internet bundle.*?(\d+(?:,\d+)?)\s*RWF/i
};

class DataProcessor {
  constructor() {
    this.parser = new xml2js.Parser({ explicitArray: false });
  }

  // Normalize amount (handle commas, convert to number)
  normalizeAmount(amountStr) {
    try {
      if (!amountStr) return null;
      const cleanAmount = amountStr.replace(/,/g, '').match(/\d+/);
      if (!cleanAmount) return null;
      const amount = parseInt(cleanAmount[0], 10);
      return isNaN(amount) ? null : amount;
    } catch (error) {
      return null;
    }
  }

  // Extract date from message
  extractDate(message) {
    const datePattern = /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/;
    const match = message.match(datePattern);
    if (match) {
      return new Date(match[0]);
    }
    return null;
  }

  // Categorize transaction based on message content
  categorizeTransaction(message) {
    for (const [type, pattern] of Object.entries(transactionPatterns)) {
      if (pattern.test(message)) {
        const match = message.match(pattern);
        return {
          type,
          amount: match ? this.normalizeAmount(match[1]) : null,
          counterparty: match && match[2] ? match[2].trim() : null
        };
      }
    }
    return { type: TRANSACTION_TYPES.UNKNOWN, amount: null, counterparty: null };
  }

  // Validate transaction data
  validateTransaction(transaction) {
    if (!transaction.type || transaction.type === TRANSACTION_TYPES.UNKNOWN) return false;
    if (!transaction.date) return false;
    if (transaction.amount === null) return false;
    if (!transaction.body) return false;
    return true;
  }

  // Process single SMS message
  async processSMS(sms) {
    try {
      const messageBody = sms.$.body;
      const date = this.extractDate(messageBody);
      const { type, amount, counterparty } = this.categorizeTransaction(messageBody);

      const transaction = {
        type,
        amount,
        counterparty,
        date,
        body: messageBody,
        protocol: sms.$.protocol,
        address: sms.$.address,
        service_center: sms.$.service_center
      };

      if (!this.validateTransaction(transaction)) {
        logger.warn('Unprocessed message', { sms });
        return null;
      }

      return transaction;
    } catch (error) {
      logger.warn('Failed to process message', { sms });
      return null;
    }
  }

  // Process XML file
  async processXMLFile(filePath) {
    try {
      const data = await fs.promises.readFile(filePath);
      const result = await this.parser.parseStringPromise(data);
      
      const processedTransactions = [];
      const unprocessedCount = 0;

      for (const sms of result.smses.sms) {
        const transaction = await this.processSMS(sms);
        if (transaction) {
          processedTransactions.push(transaction);
        }
      }

      console.log(`Processing completed. ${processedTransactions.length} messages processed.`);
      console.log('Check logs/unprocessed.log for details of unprocessed messages.');

      return processedTransactions;
    } catch (error) {
      console.error('Error processing XML file:', error.message);
      throw error;
    }
  }

  // Save processed data to database
  async saveToDatabase(transactions) {
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');

      for (const transaction of transactions) {
        await client.query(
          `INSERT INTO transactions 
           (type, amount, counterparty, date, body, protocol, address, service_center)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (body, date) DO NOTHING`,
          [
            transaction.type,
            transaction.amount,
            transaction.counterparty,
            transaction.date,
            transaction.body,
            transaction.protocol,
            transaction.address,
            transaction.service_center
          ]
        );
      }

      await client.query('COMMIT');
      console.log(`Successfully saved ${transactions.length} transactions to database`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving to database:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default DataProcessor; 