const https = require('https');
const fs = require('fs');

const liveData = JSON.parse(fs.readFileSync('scripts/live_products.json', 'utf8'));

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ status: res.statusCode, type: res.headers['content-type'], size: res.headers['content-length'] });
    }).on('error', (e) => resolve({ error: e.message }));
  });
}

async function testImages() {
  for (const item of liveData) {
    const img = item.summary.product_image;
    const res = await checkUrl(img);
    console.log(`${item.summary.product_name} (${img}):`, res.status, res.type, res.size);
  }
}

testImages();
