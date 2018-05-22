import path from 'path';

import { NodeVM, VM } from 'vm2';

export default function()
{
  const vm = new NodeVM(
    {
      sandbox: { 'window': window },
      require: 
      {
        builtin: [ 'fs', 'path' ],
        mock:
        {
          fs:
          {
            readFileSync() { return 'Nice try!'; }
          },
          oya:
          {
            helloWorld() { return 'Hello World!'; }
          }
        }
      }
    });

  vm.run(
    // `
    // const fs = require('fs');
    // const path = require('path');
    // const file = fs.readFileSync(path.join(__dirname, './sandbox.js')).toString();
    // console.log(file);
    // `
    // `
    // const oya = require('oya');

    // console.log(oya.helloWorld());
    // `
    `
    window.eval('');
    ` ,path.join(__dirname, './renderer.js')
  );

  // const vm = new VM({
  //   timeout: 1000,
  //   sandbox: {}
  // });
  
  // console.log(vm.run('1337'));
}