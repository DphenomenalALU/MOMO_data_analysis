import DataProcessor from './dataProcessor.js';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

async function main() {
  const processor = new DataProcessor();
  
  try {
    console.log('Starting data processing...');
    
    // Process XML file
    const processedTransactions = await processor.processXMLFile('modified_sms_v2.xml');
    
    // Save to database
    if (processedTransactions.length > 0) {
      console.log('Saving processed transactions to database...');
      await processor.saveToDatabase(processedTransactions);
    }

  } catch (error) {
    console.error('Error during data processing:', error.message);
    process.exit(1);
  }
}

main(); 