const fs = require('fs');
const content = fs.readFileSync('public/css/styles.css', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('sidebar') || line.includes('nav-item')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
