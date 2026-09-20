const fs = require('fs');
const https = require('https');

https.get('https://chillhealthy.com/main.dart.js', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    fs.writeFileSync('scripts/main.dart.js', data);
    console.log('Saved main.dart.js');

    // Search for all occurrences of "carte" or "ala"
    let pos = 0;
    while ((pos = data.indexOf('carte', pos)) !== -1) {
      console.log(`\n--- Match at ${pos} ---`);
      console.log(data.slice(Math.max(0, pos - 250), pos + 250));
      pos += 5;
      if (pos > 3810667) break;
    }
  });
});
