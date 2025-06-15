import path from 'path';
import { fileURLToPath } from 'url';
import DataProcessor from './dataProcessor.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    const processor = new DataProcessor();
    const xmlFile = path.join(__dirname, '../../backend/modified_sms_v2.xml');
    
    console.log('Starting SMS processing...');
    const stats = await processor.processXMLFile(xmlFile);
    console.log('Processing complete:', stats);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 