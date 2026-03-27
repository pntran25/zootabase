const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname);
const files = [
  'server.js',
  'routes/products.js',
  'routes/exhibits.js',
  'routes/events.js',
  'routes/attractions.js',
  'routes/animals.js'
];

files.forEach(f => {
  const p = path.join(baseDir, f);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  if (f === 'server.js') {
    content = content.replace(
      /path\.join\(__dirname, '\.\.\/frontend\/src\/assets\/images'\)/g, 
      'process.env.NODE_ENV === "production" ? "/tmp/images" : path.join(__dirname, "../frontend/src/assets/images")'
    );
  } else {
    content = content.replace(
      /path\.join\(__dirname, '\.\.\/\.\.\/frontend\/src\/assets\/images\/([^']+)'\)/g,
      (match, folder) => {
         return `process.env.NODE_ENV === "production" ? "/tmp/images/${folder}" : ${match}`;
      }
    );
  }
  fs.writeFileSync(p, content);
});
console.log('Update complete');
