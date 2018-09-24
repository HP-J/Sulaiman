import { NodeVM } from 'vm2';

import { readFileSync, readdirSync, existsSync } from 'fs';

import { join } from 'path';
import { platform } from 'os';
import { EventEmitter } from 'events';

import { readyState } from './renderer.js';
import { Card } from './api.js';

/** @typedef { Object } PackageData
* @property { string } name
* @property { string } version
* @property { string } description
* @property { Sulaiman } sulaiman
*/

/** @typedef { Object } Sulaiman
* @property { string } displayName
* @property { string[] } platform
* @property { boolean } theme
* @property { string[] } permissions
* @property { string[] } modules
* @property { Object.<string, string> } credits
*/

const sulaiman = new EventEmitter();

const extensionsDirectory = join(__dirname, '../extensions/');

/** the name of the extension that defined it self as a theme
* @type { string }
*/
let themeExtension = undefined;

/** an array of all the extensions that loaded
* @type { Object.<string, PackageData> } }
*/
export const loadedExtensions = {};

/** load and start all extensions
*/
export function loadExtensions()
{
  let extensionPath = undefined, packagePath = undefined;

  const extensions = readdirSync(extensionsDirectory);

  for (let i = 0; i < extensions.length; i++)
  {
    // the required extension index script
    extensionPath = extensionsDirectory + extensions[i] + '/index.js';

    // the required package json
    packagePath = extensionsDirectory + extensions[i] + '/package.json';

    // if the package.json file doesn't exists
    if (!existsSync(packagePath))
      continue;

    // if the index.js file doesn't exists continue the loop
    if (!existsSync(extensionPath))
      continue;

    /**@type { PackageData }
    */
    const data = JSON.parse(readFileSync(packagePath));

    if (data.sulaiman.platform && !data.sulaiman.platform.includes(platform()))
      return;

    // if there isn't a loaded extension with the same name
    if (!loadedExtensions[data.name])
    {
      // create a vm for the extension
      const vm = createVM(data);

      // run the extension index script
      vm.run(readFileSync(extensionPath).toString(), extensionPath);

      // append the extension that just loaded to the loaded extensions array
      loadedExtensions[data.name] = data;
    }
  }
}

export const on =
{
  /** emits when the app is fully loaded and ready to use
  * @param { () => void } callback the callback function
  */
  ready: (callback) => (readyState) ? callback() : sulaiman.addListener('ready', callback),
  /** emits every time the sulaiman app regain focus
  * @param { () => void } callback the callback function
  */
  focus: (callback) => sulaiman.addListener('focus', callback),
  /** emits every time the sulaiman app loses focus
  * @param { () => void } callback the callback function
  */
  blur: (callback) => sulaiman.addListener('blur', callback)
};

export const off =
{
  /** emits when the app is fully loaded and ready to use
  * @param { (text: string) => void } callback the callback function
  */
  ready: (callback) => sulaiman.removeListener('ready', callback),
  /** emits every time the sulaiman app regain focus
  * @param { () => void } callback the callback function
  */
  focus: (callback) => sulaiman.removeListener('focus', callback),
  /** emits every time the sulaiman app loses focus
  * @param { () => void } callback the callback function
  */
  blur: (callback) => sulaiman.removeListener('blur', callback)
};

export const is =
{
  /** returns true when the app is fully loaded and ready to use
  */
  ready: () => readyState,
};

export const emit =
{
  ready: () => sulaiman.emit('ready'),
  focus: () => sulaiman.emit('focus'),
  blur: () => sulaiman.emit('blur')
};

export function getCaller(length)
{
  const err = new Error();
  const original = Error.prepareStackTrace;

  /** @type { NodeJS.CallSite }
  */
  let stack;

  Error.prepareStackTrace = (err, stack) => stack;

  for (let i = 0; i < length; i++)
  {
    stack = err.stack.shift();
  }

  const file = stack.getFileName();
  const functionName = stack.getFunctionName();

  Error.prepareStackTrace = original;

  return { file, functionName };
}

/** creates a new NodeVM for an extension
* @param { string } extensionPath
* @param { PackageData } data
*/
function createVM(data)
{
  if (data.sulaiman.theme)
  {
    if (!themeExtension)
      themeExtension = data.name;
    else
      throw new Error(
        'conflicting themes, more that one extension wants theme permissions, ' +
        themeExtension + ' & ' + data.name);
  }

  const { sandbox, mock } = handelMockups(data.sulaiman.permissions, data.sulaiman.theme);

  // separate node builtin modules from the external modules
  const { builtin, external } = handelModules(data.sulaiman.modules);

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

  return vm;
}

/** handle permissions to use global variables and mockups
* @param { string } extensionName
* @param { string[] } requiredPermissions
* @param { boolean } theme
* @returns { { sandbox: {} } }
*/
function handelMockups(requiredPermissions, theme)
{
  requiredPermissions = requiredPermissions || [];

  // allow access to global objects
  const sandbox =
  {
    document: document,
    process: process
  };

  // override specific apis from any module or the entire module
  const mock =
  {
    sulaiman: { ...require('./api.js') }
  };

  const permissions =
  {
    // global
    document: true,
    process: true,

    // sulaiman
    window: true,
    electron: true,
    clipboard: true,
    shell: true,
    dialog: true,
    tray: true,

    // sulaiman theme
    appendStyle: !theme,
    removeStyle: !theme,
    appendStyleDir: !theme
  };

  for (let i = 0; i < requiredPermissions.length; i++)
  {
    if (permissions[requiredPermissions[i]])
      permissions[requiredPermissions[i]] = false;
  }

  for (const key in permissions)
  {
    if (permissions[key])
    {
      if (sandbox[key])
        sandbox[key] = undefined;
      
      else if (mock.sulaiman[key])
        mock.sulaiman[key] = undefined;
    }
  }

  return { sandbox, mock };
}

/** separate node builtin modules from the external modules
* and adds modules that are allowed to have by default
* @param { [] } requiredModules the modules array from the extension package data
* @returns { { builtin: [], external: [] } }
*/
function handelModules(requiredModules)
{
  const builtin = [];
  const external = [];

  // allowed by default
  builtin.push('path');

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