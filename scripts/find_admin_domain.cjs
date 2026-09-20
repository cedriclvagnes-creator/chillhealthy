const fs = require('fs');
const data = fs.readFileSync('scripts/main.dart.js', 'utf8');

let pos = 0;
while ((pos = data.indexOf('admin.chillhealthy.com', pos)) !== -1) {
  console.log(`\nMatch at ${pos}:`);
  console.log(data.slice(Math.max(0, pos - 400), pos + 400));
  pos += 20;
}
