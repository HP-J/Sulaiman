const fs = require('fs');
const path = require('path');

if (fs.existsSync(path.join(__dirname, 'compiled')))
  require('./compiled/main/main.js');
else
  module.exports = require('./src/renderer/api.js');