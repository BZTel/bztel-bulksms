import fs from 'fs';

const pdfPath = 'c:\\Users\\asnah\\Desktop\\Bztel\\Monty_Mobile_Meeting_Brief.pdf';
const content = fs.readFileSync(pdfPath);
const text = content.toString('latin1'); // Use latin1 to preserve byte characters

// Find text patterns by searching for standard words
const lines = text.split('\n');
console.log('Total text split lines:', lines.length);

const keywords = ['bind', 'transceiver', 'transmitter', 'receiver', 'smpp', 'system', 'port', 'ip', 'system_type', 'ton', 'npi'];
const matchedLines = [];

for (const line of lines) {
  // Strip non-printable characters for display
  const cleanLine = line.replace(/[^\x20-\x7E\s]/g, '').trim();
  if (cleanLine.length > 5) {
    for (const word of keywords) {
      if (cleanLine.toLowerCase().includes(word)) {
        matchedLines.push(cleanLine);
        break;
      }
    }
  }
}

console.log(`Matched lines count: ${matchedLines.length}`);
console.log('Sample matched lines (first 100):');
matchedLines.slice(0, 100).forEach(l => console.log('-', l));
