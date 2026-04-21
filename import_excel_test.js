import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'Book2.xlsx');

async function extractData() {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[1]; // Sheet 2 (0-indexed)
    if (!sheetName) {
      console.error('Sheet 2 not found');
      return;
    }
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error reading Excel:', error);
  }
}

extractData();
