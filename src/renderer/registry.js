import { NodeVM } from 'vm2';
import { join } from 'path';

/** call all extensions from their directory in a temp NodeVM
*/
export function init()
{
  const tmpVM = new NodeVM(
    {
      require:
      {
        // import should escape the context and allow the required module to require without limits
        import: [ join(__dirname, `./extension.js`) ],
        // the extensions modules
        external: [  `../extensions/ext-boilerplate.js` ],
        // sandbox keeps the requisition limits, no matter the depth
        context: `sandbox`
      }
    });
  
  // execute extensions modules, one by one 
  tmpVM.run(`require("../extensions/ext-boilerplate.js");`, __filename);
  
  console.log(`the vm exited`);
}