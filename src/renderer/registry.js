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

// /** the global events registry,
// * every event has an array of the extensions that are registered to it,
// * every time that event is called, we go to every extension registered to it and execute their callback for that specific event
// * @type { Object.<string, [ { extensionPath: string, callback: string } ]> }
// */
const extEvents = {};

/** the current active and running code extension
* @type { string } 
*/
let currentExtensionPath;

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

  // TODO move events to extension api somehow, it was stupid making it part of registry since it has noting to do with creating the vm
  
  // TODO implement handling permissions

  // 1- fs / original-fs -> remove from modules if exists
  // handel fs.read and fs.write

  // 2- window.body

  // separate node builtin modules from the external modules
  const { builtin, external } = handelSeparation(registry.modules);

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

  // if it exists
  // run the extension's start callback function
  if (registry.start)
    runInVM(extensionPath, registry.start);
}

// function handelPermissions()
// {

// }

/** separate node builtin modules from the external modules
* @param { [] } registryModules the modules requests array from the registry object
* @returns { { builtin: [], external: [] } }
*/
function handelSeparation(registryModules)
{
  const builtin = [];
  const external = [];

  // loop through all the modules requests
  for (let i = 0; i < registryModules.length; i++)
  {
    // checks if a module is a node builtin module or an external
    // and add them to two separate arrays
    if (isBuiltin(registryModules[i]))
      builtin.push(registryModules[i]);
    else
      external.push(registryModules[i]);
  }

  return {
    builtin,
    external
  };
}

/** checks if a module is a node builtin module or an external
* @returns { boolean } 
*/
function isBuiltin(moduleName)
{
  return builtinModules.indexOf(moduleName) > -1;
}

// runs an extension function inside the extension's vm
function runInVM(extensionPath, functionName, value)
{
  // set the current extension path
  // so if a extension api needs the path it can find it
  currentExtensionPath = extensionPath;

  return extVMs[extensionPath].vm.run(extVMs[extensionPath].script + '\n' + functionName + '("' + value + '");', extensionPath);
}

/** register an extension callback on an event
* @param { string } event 
* @param { string } value 
*/
export function registerCallback(event, callbackName)
{
  // if the event is not initialized yet in the global events registry then create a new parameter for it
  if (extEvents[event] === undefined)
    extEvents[event] = [];

  // add the extension's extensionPath and callback in the event's array
  extEvents[event].push({ extensionPath: currentExtensionPath, callback: callbackName });
}

/** call an event in the extensions registered on it
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
    runInVM(extEvents[event][i].extensionPath, extEvents[event][i].callback, value);
  }
}