import { DataProcessor } from './dataProcessor.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function importData() {
  try {
    const processor = new DataProcessor();
    const xmlFilePath = path.join(__dirname, '..', 'modified_sms_v2.xml');
    
    console.log('Starting data import...');
    const stats = await processor.processXMLFile(xmlFilePath);
    console.log('Import completed successfully!');
    console.log('Statistics:', stats);
    
    process.exit(0);
  } catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
  }
}

importData(); 