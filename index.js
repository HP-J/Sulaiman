const fs = require('fs');
const path = require('path');

if (fs.existsSync(path.join(__dirname, 'scr')))
  module.exports = require('./src/renderer/api.js');

if (!process.env.START)
{
  require('./compiled/main/main.js');
  
  process.env.START = 'STARTED';
}