import { NodeVM } from 'vm2';

import { join } from 'path';

export function init()
{
  const vm = new NodeVM(
    {
      require:
      {
        external: [  './ext-boilerplate.js' ],
        context: 'sandbox',
        import: [ join(__dirname, './extension.js') ]
      }
    });
  
  console.log(vm.run('require("./ext-boilerplate.js").default;', __filename));
}