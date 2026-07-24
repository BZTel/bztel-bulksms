import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const pdfPath = 'c:\\Users\\asnah\\Desktop\\Bztel\\Monty_Mobile_Meeting_Brief.pdf';
const dataBuffer = fs.readFileSync(pdfPath);

const parser = new pdf.PDFParse({ data: dataBuffer });

parser.getText().then(result => {
  if (result.text) {
    console.log('Text content (from 4000 onwards):');
    console.log(result.text.substring(4000));
  }
}).catch(err => {
  console.error('Error:', err);
});
