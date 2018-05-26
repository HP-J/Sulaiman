import { NodeVM } from 'vm2';
import { join } from 'path';

export function init()
{
  const vm = new NodeVM(
    {
      require:
      {
        import: [ join(__dirname, './extension.js') ],
        external: [  '../extensions/ext-boilerplate.js' ],
        context: 'sandbox'
      }
    });

  vm.run('require("../extensions/ext-boilerplate.js");', __filename);
  console.log('vm2 exited');
}