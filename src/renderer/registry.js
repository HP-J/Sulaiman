import { NodeVM, VMScript } from 'vm2';

import JSON5 from 'json5';
import { readFileSync } from 'fs';
import { join } from 'path';

/** @type { Object.<string, { vm: NodeVM, script: VMScript }> }
*/
const extVMs = {};

const extEvents = {};

export function init()
{
  const moduleName = join(__dirname, `../extensions/ext-boilerplate.js`);
  const jsonName = join(__dirname, `../extensions/ext-boilerplate.registry.json`);

  /** @type { { name: string, permissions: [], modules: [], events: Object.<string, string>, callback: string } }
  */
  const registry = JSON5.parse(readFileSync(jsonName));

  // ask the user for the permissions using async (don't hang the application)

  extVMs[moduleName] = 
  {
    vm: new NodeVM({
      require:
      {
        // accepted registry request node builtin modules
        // builtin: [],
        // accepted registry request modules
        // external: [ `./extension.js` ],
        // the root of the extension directory
        // root: `.`,
        // host allows any required module to require more modules inside it with no limits
        context: `host`
      }
    }),
    script: readFileSync(moduleName).toString()
  };

  if (registry.callback)
    extVMs[moduleName].vm.run(extVMs[moduleName].script + `\n` + registry.callback + `();`);

  extVMs[moduleName].vm.run(extVMs[moduleName].script + `\n` + `oninput("test");`);
  
  console.log(`the vm exited`);
}