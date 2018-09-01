import { NodeVM } from 'vm2';

import { readFileSync, readdirSync, existsSync } from 'fs';

import { join } from 'path';
import { EventEmitter } from 'events';

/** @typedef { Object } PackageData
* @property { string } name
* @property { string } version
* @property { string } description
* @property { Sulaiman } sulaiman
*/

/** @typedef { Object } Sulaiman
* @property { string } displayName
* @property { string[] } platform
* @property { string[] } permissions
* @property { string[] } modules
* @property { Object.<string, string> } credits
*/

const electron = require('electron');

/** an array of all the extensions that loaded
* @type { Object.<string, PackageData> } }
*/
export const loadedExtensions = {};

export const eventTarget = new EventEmitter();

/** load and start all extensions
*/
export function loadExtensions()
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

    const data = JSON.parse(readFileSync(packagePath));

    // if there isn't a loaded extension with the same name
    if (!loadedExtensions[data.name])
    {
      // load the extension
      loadExtension(extensionPath, data);

      // append the extension that just loaded to the loaded extensions array
      loadedExtensions[data.name] = data;
    }
  }
}


export const on =
{
  /** emits every time the user writes something into the search bar
  * @param { (text: string) => void } callback the callback function
  */
  input: (callback) => eventTarget.addListener('input', callback),
  /** emits every time the sulaiman app regain focus
  * @param { () => void } callback the callback function
  */
  focus: (callback) => eventTarget.addListener('focus', callback),
  /** emits every time the sulaiman app loses focus
  * @param { () => void } callback the callback function
  */
  blur: (callback) => eventTarget.addListener('blur', callback)
};

export const off =
{
  /** emits every time the user writes something into the search bar
  * @param { (text: string) => void } callback the callback function
  */
  input: (callback) => eventTarget.removeListener('input', callback),
  /** emits every time the sulaiman app regain focus
  * @param { () => void } callback the callback function
  */
  focus: (callback) => eventTarget.removeListener('focus', callback),
  /** emits every time the sulaiman app loses focus
  * @param { () => void } callback the callback function
  */
  blur: (callback) => eventTarget.removeListener('blur', callback)
};

export const emit =
{
  /** @param { string } text
  */
  input: (text) => eventTarget.emit('input', text),
  focus: () => eventTarget.emit('focus'),
  blur: () => eventTarget.emit('blur')
};

export function getCaller()
{
  const err = new Error();
  const original = Error.prepareStackTrace;

  Error.prepareStackTrace = (err, stack) => stack;

  err.stack.shift();
  err.stack.shift();
  const stack = err.stack.shift();

  const file = stack.getFileName();
  const functionName = stack.getFunctionName();

  Error.prepareStackTrace = original;

  return { file, functionName };
}

/** creates a new NodeVM for an extension and runs its index.js
* @param { string } extensionPath
* @param { PackageData } data
*/
function loadExtension(extensionPath, data)
{
  const { sandbox, mock } = handelPermissions(data.sulaiman.permissions);

  // separate node builtin modules from the external modules
  const { builtin, external } = handelSeparation(data.sulaiman.modules);

  // create a new vm for the extension with the modules and permissions required
  const vm = new NodeVM({
    sandbox: sandbox,
    require:
    {
      // node builtin modules
      builtin: builtin,
      // external modules
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
}

/** handle permissions to use global variables and mockups
* @param { [] } requiredPermissions
* @returns { { sandbox: {} } }
*/
function handelPermissions(requiredPermissions)
{
  // allow access to global objects
  const sandbox =
  {
    document:
    {
      createElement: document.createElement,
      createElementNS: document.createElementNS
    },
    process: process
  };

  // override specific apis from any module
  const mock =
  {
    sulaiman: require('./api.js')
  };

  if (requiredPermissions)
  {
    for (let i = 0; i < requiredPermissions.length; i++)
    {
      // global
      if (requiredPermissions[i] === 'document')
        sandbox.document = document;
      
      // sulaiman
      else if (requiredPermissions[i] === 'window')
        mock.sulaiman.window = electron.remote.getCurrentWindow();
      else if (requiredPermissions[i] === 'clipboard')
        mock.sulaiman.clipboard = electron.clipboard;
      else if (requiredPermissions[i] === 'shell')
        mock.sulaiman.shell = electron.shell;
      else if (requiredPermissions[i] === 'dialog')
        mock.sulaiman.dialog = electron.dialog;
    }
  }

  return { sandbox, mock };
}

/** separate node builtin modules from the external modules
* @param { [] } requiredModules the modules array from the extension package data
* @returns { { builtin: [], external: [] } }
*/
function handelSeparation(requiredModules)
{
  const builtin = [], external = [];

  if (requiredModules)
  {
    // loop through all the listed modules
    for (let i = 0; i < requiredModules.length; i++)
    {
      // checks if a module is a node builtin module or an external
      // and add them to two separate arrays
      (isBuiltin(requiredModules[i]) ? builtin : external).push(requiredModules[i]);
    }
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