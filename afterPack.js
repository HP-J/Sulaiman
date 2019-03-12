var { copySync, readJsonSync, writeJSONSync } = require('fs-extra');
var { join } = require('path');

exports.default = async function(context)
{
  var projectDir = context.packager.projectDir;
  var outputDir = join(context.appOutDir, '/resources/app');

  // copy the compiled files as is
  copySync(join(projectDir, '/compiled'), join(outputDir, '/compiled'));
  
  console.log('  • copied all compiled files into output directory successfully.');

  // read package.json
  const packageData = readJsonSync(join(projectDir, '/package.json'));

  // override the main point to main.js
  packageData.main = 'compiled/main/main.js';

  // write the new package.json to the output directory
  writeJSONSync(join(outputDir, '/package.json'), packageData);

  console.log('  • updated package.json to point to main.js instead of index.js.');
}
