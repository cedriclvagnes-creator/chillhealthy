const https = require("https");

const searchTerms = ["asian-woman-kitchen", "asian-chef", "woman-preparing-food-kitchen"];

async function getPhotos(term) {
  return new Promise((resolve) => {
    https.get(`https://unsplash.com/s/photos/${term}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        const regex = /https:\/\/images\.unsplash\.com\/photo-([0-9a-zA-Z\-_]+)/g;
        const ids = new Set();
        let m;
        while ((m = regex.exec(data)) !== null) {
          ids.add(m[0]);
        }
        resolve(Array.from(ids));
      });
    }).on("error", () => resolve([]));
  });
}

(async () => {
  for (const t of searchTerms) {
    const urls = await getPhotos(t);
    console.log(`=== ${t} (${urls.length}) ===`);
    urls.slice(0, 8).forEach(u => console.log(u));
  }
})();
