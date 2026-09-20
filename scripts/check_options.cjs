const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scripts/live_products.json', 'utf8'));

for (const item of data) {
  const d = item.details;
  if (d && d.product_options && d.product_options.length > 0) {
    console.log(`\nProduct ${d.product_id} (${d.product_name}) has options:`, JSON.stringify(d.product_options, null, 2));
  }
}
