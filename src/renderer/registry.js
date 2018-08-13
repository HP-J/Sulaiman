import { NodeVM } from 'vm2';

import { readFileSync, readdirSync, existsSync } from 'fs';

import { join } from 'path';

/** an array of all the extensions that loaded
* @type { Object.<string, PackageMeta> } }
*/
export const loadedExtensions = {};

/** the sulaiman events extensions are registered in
* @type { Object.<string, Function[]> }
*/
const extEvents = {};

/** @typedef { Object } PackageMeta
* @property { string } name
* @property { string } version
* @property { string } description
* @property { Registry } sulaiman
*/

/** @typedef { Object } Registry
* @property { string } displayName
* @property { string[] } permissions
* @property { string[] } modules
*/

/** load and start all extensions
*/
export function loadExtensionsDir()
{
  const root = join(__dirname, '../extensions/');

  let extensionPath = undefined, packagePath = undefined;

  const extensions = readdirSync(root);

  for (let i = 0; i < extensions.length; i++)
  {
    // the required extension index script
    extensionPath = root + extensions[i] + '/index.js';

    // the required package json
    packagePath = root + extensions[i] + '/package.json';

    // if the package.json file doesn't exists
    if (!existsSync(packagePath))
      continue;

    // if the index.js file doesn't exists continue the loop
    if (!existsSync(extensionPath))
      continue;

    // load the extension
    loadExtension(extensionPath, JSON.parse(readFileSync(packagePath)));
  }
}

/** creates a new NodeVM for an extension and runs its index.js
* @param { string } extensionPath
* @param { PackageMeta } packageMeta
*/
function loadExtension(extensionPath, packageMeta)
{
  const { sandbox, mock } = handelPermissions(packageMeta.sulaiman.permissions);

  // separate node builtin modules from the external modules
  const { builtin, external } = handelSeparation(packageMeta.sulaiman.modules);

  // create a new vm for the extension with the modules and permissions required
  const vm = new NodeVM({
    sandbox: sandbox,
    require:
    {
      // accepted registry request node builtin modules
      builtin: builtin,
      // accepted registry request modules
      external: external,
      // limit externals to this path, so extensions can't require any local modules outside of their directory
      root: 'none',
      // allow access to the running sulaiman apis
      mock: mock,
      // host allows any required module to require more modules inside it with no limits
      context: 'host'
    }
  });

  // run the extension index script
  vm.run(readFileSync(extensionPath).toString(), extensionPath);

  // append the extension that just loaded to the loaded extensions array
  loadedExtensions[packageMeta.name] = packageMeta;
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
    sulaiman: require('./api.js')
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
  try
  {
    const resolved = require.resolve(moduleName);

    return !resolved.includes(require('path').sep);
  }
  catch (e)
  {
    return false;
  }
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