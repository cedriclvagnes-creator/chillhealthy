const fs = require('fs');
const data = fs.readFileSync('scripts/main.dart.js', 'utf8');

// Find references to c9 or constructor
let pos = 0;
while ((pos = data.indexOf('c9', pos)) !== -1) {
  const snippet = data.slice(Math.max(0, pos - 50), pos + 100);
  if (snippet.includes('new A.c9') || snippet.includes('.c9') || snippet.includes('c9(')) {
    console.log(`\nMatch at ${pos}:`);
    console.log(snippet);
  }
  pos += 2;
}
