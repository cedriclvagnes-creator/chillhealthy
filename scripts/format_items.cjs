const fs = require('fs');

const liveData = JSON.parse(fs.readFileSync('scripts/live_products.json', 'utf8'));

console.log('Total items:', liveData.length);

liveData.forEach((item, idx) => {
  const p = item.summary;
  console.log(`${idx + 1}. ID: ${p.product_id}, Name: "${p.product_name}", Price: ${p.product_price}, Image: "${p.product_image}"`);
});
