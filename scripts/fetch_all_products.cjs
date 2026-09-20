const fs = require('fs');
const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching all products...');
  const allProds = await fetchJson('https://admin.chillhealthy.com/api/product/action/all');
  console.log('Total products:', allProds.data?.length);

  const detailedProducts = [];

  for (const p of allProds.data) {
    console.log(`Fetching details for product ${p.product_id}: ${p.product_name}...`);
    try {
      const details = await fetchJson(`https://admin.chillhealthy.com/api/product/action/details/product_id/${p.product_id}`);
      detailedProducts.push({
        summary: p,
        details: details.data || details
      });
    } catch (err) {
      console.error(`Failed product ${p.product_id}:`, err.message);
      detailedProducts.push({ summary: p, details: null });
    }
  }

  fs.writeFileSync('scripts/live_products.json', JSON.stringify(detailedProducts, null, 2));
  console.log('Saved live_products.json successfully!');
}

run().catch(console.error);
