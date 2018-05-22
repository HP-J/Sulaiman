// import * as extension from './extension.js';

const fs = require('fs');

console.log(fs.readFileSync(__filename).toString());
// extension.register(
//   {
//     displayName: 'hello i am ext test'
//   });

// export function register()
// {
//   console.log('better');
// }

// console.log('worst');