const fs = require('fs');
const data = fs.readFileSync('scripts/main.dart.js', 'utf8');

// Search for http requests or endpoints
const regex = /"(\/[a-zA-Z0-9_\-\/]+)"/g;
let match;
const endpoints = new Set();
while ((match = regex.exec(data)) !== null) {
  if (match[1].length > 3 && !match[1].startsWith('/#') && !match[1].startsWith('/v1')) {
    endpoints.add(match[1]);
  }
}
console.log('Endpoints found:', [...endpoints].filter(e => 
  e.includes('api') || e.includes('prod') || e.includes('menu') || e.includes('cart') || e.includes('item') || e.includes('meal') || e.includes('dish') || e.includes('order') || e.includes('food')
));

// Also let's search for any string containing 'Chicken' or 'Salmon' or 'Rice' or 'Salad'
const foodRegex = /"([^"]*(?:Chicken|Salmon|Beef|Pasta|Rice|Salad|Bento|Bowl|Healthy|Signature)[^"]*)"/gi;
const foodMatches = new Set();
while ((match = foodRegex.exec(data)) !== null) {
  if (match[1].length < 100) foodMatches.add(match[1]);
}
console.log('Food matches:', [...foodMatches].slice(0, 50));
