import { NodeVM } from 'vm2';

import { readFileSync, readdirSync, existsSync } from 'fs';

import { join } from 'path';

import builtinModules from 'builtin-modules';

/** the global events registry
* @type { Object.<string, Function[]> }
*/
const extEvents = {};

/** @typedef { Object } Registry
* @property { string } name
* @property { string[] } permissions
* @property { string[] } modules
*/

/** load and start all extensions
*/
export function loadExtensionsDir()
{
  const root = join(__dirname, '../extensions/');

  let extensionPath = undefined, registryPath = undefined;

  const extensions = readdirSync(root);

  for (let i = 0; i < extensions.length; i++)
  {
    // the required extension index script
    extensionPath = root + extensions[i] + '/index.js';

    // the required extension registry json
    registryPath = root + extensions[i] + '/registry.json';

    // if the index.js file doesn't exists continue the loop
    if (!existsSync(extensionPath))
      continue;
    
    // if the registry.json file doesn't exists
    if (!existsSync(registryPath))
      continue;

    // load the extension
    loadExtension(extensionPath, JSON.parse(readFileSync(registryPath)));
  }
}

/** creates a new NodeVM with the registry object
* @param { string } extensionPath
* @param { Registry } registry
*/
function loadExtension(extensionPath, registry)
{
  const { sandbox, mock } = handelPermissions(registry.permissions);

  // separate node builtin modules from the external modules
  const { builtin, external } = handelSeparation(registry.modules);

  // create a new vm for the extension with the modules and permissions required
  const vm = new NodeVM({
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
      mock: mock,
      // host allows any required module to require more modules inside it with no limits
      context: 'host'
    }
  });

  // run the extension index script
  vm.run(readFileSync(extensionPath).toString(), extensionPath);
}

/** handle permissions to use global variables and mockups
* @param { [] } registryPermissions
* @returns { { sandbox: {} } }
*/
function handelPermissions(registryPermissions)
{
  // allow access to global objects
  const sandbox =
  {
    document:
    {
      createElement: document.createElement,
      createElementNS: document.createElementNS
    }
  };

  // override specific apis from any module
  const mock =
  {
    sulaiman: require('./extension.js')
  };

  for (let i = 0; i < registryPermissions.length; i++)
  {
    if (registryPermissions[i] === 'body')
      sandbox.document['body'] = document.body;
    
    else if (registryPermissions[i] === 'clipboard')
      mock.sulaiman.clipboard = require('electron').clipboard;
  }

  return { sandbox, mock };
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

/** register an extension callback on an event
* @param { string } eventName
* @param { Function } callback
*/
export function registerCallback(eventName, callback)
{
  // if the event is not initialized yet in the global events registry then create a new parameter for it
  if (extEvents[eventName] === undefined)
    extEvents[eventName] = [];

  // add the extension's extensionPath and callback in the event's array
  extEvents[eventName].push(callback);
}

/** emits an event's callbacks
* @param { string } eventName
* @param { any[] } args
*/
export function emitCallbacks(eventName, ...args)
{
  // check if (any) extension has registered for the event
  if (extEvents[eventName] === undefined)
    return;

  // loop though all the extensions in the event
  for (let i = 0; i < extEvents[eventName].length; i++)
  {
    // emit the callback
    extEvents[eventName][i](...args);
  }
}