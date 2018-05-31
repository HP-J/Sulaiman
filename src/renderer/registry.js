import { NodeVM } from 'vm2';

import { readFileSync } from 'fs';
import { join } from 'path';

import JSON5 from 'json5';

import builtinModules from 'builtin-modules';

/** a list of all the extensions' vms,
* the extension extensionPath is the key, while the NodeVM is the value
* @type { Object.<string, { vm: NodeVM, script: string }> }
*/
const extVMs = {};

/** the global events registry,
* every event has an array of the extensions that are registered to it,
* every time that event is called, we go to every extension registered to it and execute their callback for that specific event
* @type { Object.<string, [ { extensionPath: string, callback: string } ]> }
*/
const extEvents = {};

export function init()
{
  const extensionPath = join(__dirname, '../extensions/ext-boilerplate.js');
  const registryPath = join(__dirname, '../extensions/ext-boilerplate.registry.json');

  /** parse the registry object JSON file
  * @type { { name: string, permissions: [], modules: [], events: Object.<string, string>, start: string } }
  */
  const registry = JSON5.parse(readFileSync(registryPath));

  // TODO ask the user for the permissions using async (don't hang the application)
  // when we get a respond if it was a reject then return
  // else if approve

  // TODO implement permissions

  const builtin = [];
  const external = [];

  // separate node builtin modules from the external modules
  for (let i = 0; i < registry.modules.length; i++)
  {
    if (isBuiltin(registry.modules[i]))
      builtin.push(registry.modules[i]);
    else
      external.push(registry.modules[i]);
  }

  // create a new vm for the extension with only the modules and permissions the user approved
  extVMs[extensionPath] = 
  {
    vm: new NodeVM({
      require:
      {
        // accepted registry request node builtin modules
        builtin: builtin,
        // accepted registry request modules
        external: [ './extension.js', ...external ],
        // limit externals to this path, so extensions can't require any local modules outside of their directory
        root: join(__dirname, '../extensions'),
        // host allows any required module to require more modules inside it with no limits
        context: 'host'
      }
    }),
    script: readFileSync(extensionPath).toString()
  };

  // register the extension events in the global events registry
  for (const event in registry.events)
  {
    // if the event is not initialized yet in the global events registry then create a new parameter for it
    if (extEvents[event] === undefined)
      extEvents[event] = [];

    // add the extension's extensionPath and callback in the event's array
    // extEvents[event].push({ extensionPath: extensionPath, callback: registry.events[event] });
  }

  // if it exists
  // run the extension's start callback function
  if (registry.start)
    run(extensionPath, registry.start);
}

/** call an event on the extensions registered for it
* @param { string } event 
* @param { string } value 
*/
export function callEvent(event, value)
{
  // check if any extension has registered for the event
  if (extEvents[event] === undefined)
    return;

  // loop though all the extensions in the event
  for (let i = 0; i < extEvents[event].length; i++)
  {
    // execute the callback on the extension's vm
    run(extEvents[event][i].moduleName, extEvents[event][i].callback, value);
  }
}

function isBuiltin(moduleName)
{
  return builtinModules.indexOf(moduleName) > -1;
}

// runs an extension function inside the extension's vm
function run(extensionPath, functionName, value)
{
  return extVMs[extensionPath].vm.run(extVMs[extensionPath].script + '\n' + functionName + '("' + value + '");', extensionPath);
}