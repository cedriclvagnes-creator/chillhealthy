const fs = require('fs');
const data = fs.readFileSync('scripts/main.dart.js', 'utf8');

const c0Idx = data.indexOf('C0(');
console.log('Index of C0(:', c0Idx);
if (c0Idx !== -1) {
  console.log(data.slice(c0Idx - 100, c0Idx + 600));
}

// Also let's search for all `C0(` definitions
let pos = 0;
while ((pos = data.indexOf('C0(', pos)) !== -1) {
  console.log(`\nMatch at ${pos}:`);
  console.log(data.slice(Math.max(0, pos - 100), pos + 300));
  pos += 3;
  if (pos > 3810667) break;
}
