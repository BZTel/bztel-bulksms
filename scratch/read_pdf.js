import fs from 'fs';
import path from 'path';

const pdfPath = 'c:\\Users\\asnah\\Desktop\\Bztel\\Monty_Mobile_Meeting_Brief.pdf';
const content = fs.readFileSync(pdfPath);
const text = content.toString('utf-8');

// Find all printable ASCII sequences of length 4 or more
const regex = /[\x20-\x7E]{4,}/g;
const matches = text.match(regex) || [];

console.log('Matches count:', matches.length);
const filtered = matches.filter(m => 
  m.toLowerCase().includes('password') || 
  m.toLowerCase().includes('bzt') || 
  m.toLowerCase().includes('smpp') ||
  m.toLowerCase().includes('user') ||
  m.toLowerCase().includes('host') ||
  m.toLowerCase().includes('port')
);

console.log('Filtered matches:');
filtered.forEach(m => console.log(m.trim()));
