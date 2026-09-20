const fs = require('fs');
const data = fs.readFileSync('scripts/main.dart.js', 'utf8');

// Find references to function c9 or "api/"
let pos = 0;
while ((pos = data.indexOf('"api/"', pos)) !== -1) {
  console.log(`\nMatch at ${pos}:`);
  console.log(data.slice(pos, pos + 1000));
  pos += 6;
}

// Also find what methods are on c9 prototype or related API service
let c9Proto = data.indexOf('c9.prototype');
console.log('c9.prototype index:', c9Proto);
if (c9Proto !== -1) {
  console.log(data.slice(c9Proto, c9Proto + 3000));
}
