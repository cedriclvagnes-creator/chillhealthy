const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scripts/live_products.json', 'utf8'));

console.log('Sample item 0:');
console.log(JSON.stringify(data[0], null, 2));

console.log('\n--- All 24 Items Summary ---');
data.forEach((item, idx) => {
  const p = item.summary;
  const d = item.details || {};
  console.log(`${idx + 1}. [ID: ${p.product_id}] ${p.product_name} | RM ${p.product_price} | Img: ${p.product_image}`);
  if (d.product_description) {
    console.log(`   Desc: ${d.product_description}`);
  }
  if (d.product_options && d.product_options.length > 0) {
    console.log(`   Options: ${d.product_options.map(o => o.product_options_name || o.name).join(', ')}`);
  }
});
