import { NodeVM } from 'vm2';

import { readFileSync } from 'fs';
import { join } from 'path';

import JSON5 from 'json5';

/** a list of all the extensions' vms,
* the extension moduleName is the key, while the NodeVM is the value
* @type { Object.<string, { vm: NodeVM, script: string }> }
*/
const extVMs = {};

/** the global events registry,
* every event has an array of the extensions that are registered to it,
* every time that event is called, we go to every extension registered to it and execute their callback for that specific event
* @type { Object.<string, [ { moduleName: string, callback: string } ]> }
*/
const extEvents = {};

export function init()
{
  const moduleName = join(__dirname, '../extensions/ext-boilerplate.js');
  const registryName = join(__dirname, '../extensions/ext-boilerplate.registry.json');

  /** parse the registry object json file
  * @type { { name: string, permissions: [], modules: [], events: Object.<string, string>, start: string } }
  */
  const registry = JSON5.parse(readFileSync(registryName));

  // TODO ask the user for the permissions using async (don't hang the application)
  // when we get a respond if it was a reject then return
  // else if approve

  // TODO implement builtin modules

  // create a new vm for the extension with only the modules and permissions the user approved
  extVMs[moduleName] = 
  {
    vm: new NodeVM({
      require:
      {
        // accepted registry request node builtin modules
        // builtin: [],
        // accepted registry request modules
        external: [ './extension.js' ],
        // limit externals to this path, so extensions can't require any local modules outside of their directory
        root: join(__dirname, '../extensions'),
        // host allows any required module to require more modules inside it with no limits
        context: 'host'
      }
    }),
    script: readFileSync(moduleName).toString()
  };

  // register then extension events in the global events registry
  for (const event in registry.events)
  {
    // if the event is not initialized yet in the global events registry then create a new parameter for it
    if (extEvents[event] === undefined)
      extEvents[event] = [];

    // register the extension's moduleName in the event's array
    extEvents[event].push({ moduleName: moduleName, callback: registry.events[event] });
  }

  // run the start function of the extension, if it exists
  if (registry.start)
    extVMs[moduleName].vm.run(extVMs[moduleName].script + '\n' + registry.start + '();', moduleName);
}

/** call an event on the extensions registered in it
* @param { string } event 
* @param { * } value 
*/
export function callEvent(event, value)
{
  // if the event is initialized, aka any extension has registered in it
  if (extEvents[event])
  {
    // loop though all the extensions in the event
    for (let i = 0; i < extEvents[event].length; i++)
    {
      const moduleName = extEvents[event][i].moduleName;

      // execute the callback on the extension's vm
      extVMs[moduleName].vm.run(extVMs[moduleName].script + '\n' + extEvents[event][i].callback + '("' + value + '");');
    }
  }
}