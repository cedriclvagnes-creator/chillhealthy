const fs = require('fs');
const data = fs.readFileSync('scripts/main.dart.js', 'utf8');

// Find where "product/action/all" is called in main.dart.js
let pos = 0;
while ((pos = data.indexOf('"product/action/all"', pos)) !== -1) {
  console.log(`\nMatch at ${pos}:`);
  console.log(data.slice(Math.max(0, pos - 200), pos + 800));
  pos += 20;
}
