const fs = require('fs');
const data = fs.readFileSync('scripts/main.dart.js', 'utf8');

// Find references to index 1 in the page view or state
// Let's search around 2695328 for the switch or IndexedStack or PageView or body
console.log('--- Context around 2695328 ---');
console.log(data.slice(2694500, 2696000));
