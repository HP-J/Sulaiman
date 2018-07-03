import { NodeVM } from '@herpproject/vm2';

import { readFileSync, readdirSync, existsSync, lstatSync } from 'fs';
import { join } from 'path';

import builtinModules from 'builtin-modules';

/** a list of all the extensions' vms,
* @type { Object.<string, { vm: NodeVM, script: string }> }
*/
const extVMs = {};

/** the global events registry
* @type { Object.<string, Function[]> }
*/
const extEvents = {};

/** the current active and running code extension
* @type { string }
*/
export let currentExtensionPath;

/** @typedef { Object } Registry
* @property { string } name
* @property { string[] } permissions
* @property { string[] } modules
* @property { string } start
*/

/** load and start all extensions
*/
export function loadExtensions()
{
  const root = join(__dirname, '../extensions/');

  let extensionPath = undefined;
  let registryPath = undefined;

  const extensions = readdirSync(root);

  for (let i = 0; i < extensions.length; i++)
  {
    // if the path isn't to a directory continue the loop
    if (!lstatSync(root + extensions[i]).isDirectory())
      continue;

    // the required files
    extensionPath = root + extensions[i] + '/index.js';
    registryPath = root + extensions[i] + '/registry.json';

    // if the index.js file doesn't exists continue the loop
    if (!existsSync(extensionPath))
      continue;
    
    // if the registry.json file doesn't exists
    if (!existsSync(registryPath))
      continue;

    // ask the user then load the extension when he and if he accepts the registry object
    askUser(extensionPath, JSON.parse(readFileSync(registryPath)),
      (extensionPath, registry) => { loadExtension(extensionPath, registry); });
  }
}

// TODO actually asking the user using GUI

/** Ask the user using GUI if he accepts an extension's registry object [async]
* @param { string } extensionPath
* @param { Registry } registry
* @param { (extensionPath: string, registry: Registry) => void } callback
*/
function askUser(extensionPath, registry, callback)
{
  callback(extensionPath, registry);
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
        mock: mock,
        // host allows any required module to require more modules inside it with no limits
        context: 'host'
      }
    }),
    script: readFileSync(extensionPath).toString()
  };

  // TODO try to remove runFunction entirety by getting start function from the exports and calling it
  // if so revamp emitCallbacks to be less like runFunction
  // delete the fork of vm2 and use a the normal node pack
  // update docs to remove the stupid limits that runFunction had

  // TODO remove anything that uses currentExtensionPath because it's no longer reliable

  // if it exists
  // run the extension's start callback function
  if (registry.start)
    runFunction(extensionPath, registry.start);
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
    document: {}
  };

  // override specific apis from any module
  const mock =
  {
    sulaiman: require('./extension.js')
  };

  for (let i = 0; i < registryPermissions.length; i++)
  {
    if (registryPermissions[i] === 'document.body')
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

/** run a function in the an extension script inside its NodeVM
* @param { string } extensionPath
* @param { string } functionName
* @param { any } thisArg
* @param { any[] } args
*/
export function runFunction(extensionPath, functionName, thisArg, ...args)
{
  // set the current extension path
  // so if a extension api needs the path it can find it
  currentExtensionPath = extensionPath;

  return extVMs[extensionPath].vm.runFunction(extVMs[extensionPath].script, functionName, extensionPath, thisArg, ...args);
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
* @param { any } thisArg
* @param { any[] } args
*/
export function emitCallbacks(eventName, thisArg, ...args)
{
  // check if (any) extension has registered for the event
  if (extEvents[eventName] === undefined)
    return;

  // loop though all the extensions in the event
  for (let i = 0; i < extEvents[eventName].length; i++)
  {
    // emit the callback
    extEvents[eventName][i].call(thisArg, ...args);
  }
}