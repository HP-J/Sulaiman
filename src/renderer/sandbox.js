import path from 'path';

import { NodeVM, VM } from 'vm2';

export default function()
{
  const vm = new NodeVM({
    require: {
      external: true
    }
  });
  
  vm.run(`
      var request = require('request');

      request('http://www.google.com', function (error, response, body) {
          console.error(error);
          if (!error && response.statusCode == 200) {
              console.log(body) // Show the HTML for the Google homepage.
          }
      })
      
      `, path.join(__dirname, './renderer.js'));

  // const vm = new VM({
  //   timeout: 1000,
  //   sandbox: {}
  // });
  
  // console.log(vm.run('1337'));
}