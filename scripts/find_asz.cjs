const fs = require('fs');
const data = fs.readFileSync('scripts/main.dart.js', 'utf8');

const pos = data.indexOf('aSZ:function aSZ');
console.log('Index of aSZ:', pos);
if (pos !== -1) {
  console.log(data.slice(pos, pos + 1500));
}

const posProto = data.indexOf('A.aSZ.prototype');
console.log('Index of aSZ.prototype:', posProto);
if (posProto !== -1) {
  console.log(data.slice(posProto, posProto + 2500));
}
