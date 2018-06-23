import { NodeVM } from 'vm2';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

import JSON5 from 'json5';

import builtinModules from 'builtin-modules';

/** a list of all the extensions' vms,
* @type { Object.<string, { vm: NodeVM, script: string }> }
*/
const extVMs = {};

/** the global events registry
* @type { Object.<string, [ { extensionPath: string, callbackName: string } ]> }
*/
const extEvents = {};

/** the current active and running code extension
* @type { string } 
*/
let currentExtensionPath;

// TODO read the extensions directory

export function init()
{
  const extensionPath = join(__dirname, '../extensions/boilerplate/index.js');
  const registryPath = join(__dirname, '../extensions/boilerplate/registry.json');

  /** parse the registry object JSON(5) file
  * @type { { name: string, permissions: [], modules: [], start: string } }
  */
  const registry = (existsSync(registryPath + '5')) ? 
    JSON5.parse(readFileSync(registryPath + '5')) : JSON.parse(readFileSync(registryPath));

  // TODO ask the user for the permissions using async (don't hang the application)
  // when we get a respond if it was a reject then return
  // else if approve

  const sandbox = handelPermissions(registry.permissions);

  // separate node builtin modules from the external modules
  const { builtin, external } = handelSeparation(registry.modules);

  // create a new vm for the extension with only the modules and permissions the user approved
  extVMs[extensionPath] = 
  {
    vm: new NodeVM({
      sandbox: sandbox,
      require:
      {
        // accepted registry request node builtin modules
        builtin: builtin,
        // accepted registry request modules
        external: [ './extension.js', ...external ],
        // limit externals to this path, so extensions can't require any local modules outside of their directory
        root: join(__dirname, '../extensions/boilerplate'),
        // allow access to the running sulaiman apis
        mock: {
          'sulaiman': require('./extension.js')
        },
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

/** handle permissions to use global variables
* @param { [] } registryPermissions
* @returns { { sandbox: {} } }
*/
function handelPermissions(registryPermissions)
{
  const sandbox =
  {
    document: document
  };

  // TODO debug code => remove
  // sandbox.document.createElement =  document.createElement.bind(document);
  // sandbox.document.body = document.body;

  // sandbox.document.createElement = document.contains;
  
  // for (let i = 0; i < registryPermissions.length; i++)
  // {
  //   if (registryPermissions[i] === 'document.body')
  //     sandbox.document['body'] = document.body;
  // }

  // sandbox.document['createElement'] = document.createElement;
  // sandbox.document.createElementNS = document.createElementNS;

  return sandbox;
}

/** separate node builtin modules from the external modules
* @param { [] } registryModules the modules requests array from the registry object
* @returns { { builtin: [], external: [] } }
*/
function handelSeparation(registryModules)
{
  const builtin = [], external = [];

  // loop through all the modules requests
  for (let i = 0; i < registryModules.length; i++)
  {
    // checks if a module is a node builtin module or an external
    // and add them to two separate arrays
    (isBuiltin(registryModules[i]) ? builtin : external).push(registryModules[i]);
  }

  return { builtin, external };
}

/** checks if a module is a node builtin module or an external
* @returns { boolean } 
*/
function isBuiltin(moduleName)
{
  return builtinModules.indexOf(moduleName) > -1;
}

// runs an extension function inside the extension's vm
function runInVM(extensionPath, functionName, args)
{
  // set the current extension path
  // so if a extension api needs the path it can find it
  currentExtensionPath = extensionPath;

  return extVMs[extensionPath].vm.run(extVMs[extensionPath].script + '\n' + functionName + '(' + args + ');', extensionPath);
}

/** register an extension callback on an event
* @param { string } eventName ""
* @param { string } value 
*/
function registerCallback(eventName, callbackName)
{
  // if the event is not initialized yet in the global events registry then create a new parameter for it
  if (extEvents[eventName] === undefined)
    extEvents[eventName] = [];

  // add the extension's extensionPath and callback in the event's array
  extEvents[eventName].push({ extensionPath: currentExtensionPath, callbackName: callbackName });
}

/** emits an event's callbacks
* @param { string } eventName 
* @param { string } args 
*/
function emitCallbacks(eventName, args)
{
  // check if (any) extension has registered for the event
  if (extEvents[eventName] === undefined)
    return;

  // loop though all the extensions in the event
  for (let i = 0; i < extEvents[eventName].length; i++)
  {
    // emit the callback on the extension's vm
    runInVM(extEvents[eventName][i].extensionPath, extEvents[eventName][i].callbackName, args);
  }
}

/** emits every time the user writes something into the search bar
* @param { () => any } callback the callback function
*/
export function onSearchInput(callback)
{
  registerCallback('onSearchBar', callback.name);
}

/** emits every time the user writes something into the search bar
* @param { string } args
*/
export function emitSearchInput(args)
{
  emitCallbacks('onSearchBar', args);
}