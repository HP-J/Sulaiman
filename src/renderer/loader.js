import { NodeVM } from 'vm2';

import { readFileSync, readdirSync, existsSync } from 'fs';

import { join } from 'path';
import { platform } from 'os';
import { EventEmitter } from 'events';

import { readyState } from './renderer.js';
import { registerPhrase, unregisterPhrase, isRegisteredPhrase } from './search.js';

/** @typedef { Object } PackageData
* @property { string } name
* @property { string } version
* @property { string } description
* @property { Sulaiman } sulaiman
*/

/** @typedef { Object } SulaimanData
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
  let extensionPath, scriptPath, packagePath;

  const extensions = readdirSync(extensionsDirectory);

  for (let i = 0; i < extensions.length; i++)
  {
    // main directory of the extension
    extensionPath = extensionsDirectory + extensions[i];

    // the required extension index script
    scriptPath = join(extensionPath, 'index.js');;

    // the required package json
    packagePath = join(extensionPath, 'package.json');

    // if the package.json file doesn't exists
    if (!existsSync(packagePath))
      continue;

    // if the index.js file doesn't exists continue the loop
    if (!existsSync(scriptPath))
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
      const vm = createVM(data, extensionPath);

      // run the extension index script
      vm.run(readFileSync(scriptPath).toString(), scriptPath);

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
  /** register a phrase, then returns a card controlled only by the search system
  * @param { string | RegExp } phrase
  * @param { string[] } [args] an array of possible arguments like: the 'Tray' in 'Options Tray'
  * @param { (phrase: PhraseObj, argument: string, extra: string) => boolean } [activate] emits when the phrase and/or an argument is matched,
  * should return a boolean that equals true to show the phrase's card or equals false to not show it, default is true
  * @param { (phrase: PhraseObj) => boolean } [enter] emits when the user presses the `Enter` key while the search bar is on focus
  * and the phrase and/or an argument is matched, should return a boolean that equals true to clear the search bar after
  * which will deactivate the phrase, or equals false to leave the phrase active, default is false
  * @returns { Promise<PhraseObj> }
  */
  phrase: registerPhrase,
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
  /** unregister a card, then returns a clone of the card that can be controlled by you
  * @param { Card } card
  * @returns { Promise<Card> }
  */
  phrase: unregisterPhrase,
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
  /** returns true if the same phrase is registered already, false if it's not
  * @param { string | RegExp } phrase
  * @returns { Promise<boolean> }
  */
  phrase: isRegisteredPhrase
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
* @param { PackageData } data
* @param { string } extensionPath
*/
function createVM(data, extensionPath)
{
  // handle conflicting themes (more than one extension want theme permissions)
  if (data.sulaiman.theme)
  {
    if (!themeExtension)
      themeExtension = data.name;
    else
      throw new Error(
        'conflicting themes, more that one extension wants theme permissions, ' +
        themeExtension + ' & ' + data.name);
  }

  const { sandbox, enforcedMocks } = handelMockups(data.sulaiman.permissions, data.sulaiman.theme);

  // separate node builtin modules from the external modules
  const { builtin, externalMocks } = handelModules(data.sulaiman.modules, extensionPath);

  const mocks = { ...enforcedMocks, ...externalMocks };

  // create a new vm for the extension with the modules and permissions required
  const vm = new NodeVM({
    sandbox: sandbox,
    require:
    {
      // node builtin modules
      builtin: builtin,
      // needs to be an empty array to allow local modules to run
      external: [],
      // limit externals to this path, so extensions can't require scripts/modules outside of their root directory
      root: extensionPath,
      // allow access to the running sulaiman apis and external modules
      mock: mocks,
      // host allows any required module to require more modules inside it with no limits
      context: 'sandbox'
    }
  });

  return vm;
}

/** handle permissions to use global variables and mockups
* @param { string } extensionName
* @param { string[] } requiredPermissions
* @param { boolean } theme
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
  const enforcedMocks =
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
      
      else if (enforcedMocks.sulaiman[key])
        enforcedMocks.sulaiman[key] = undefined;
    }
  }

  return { sandbox, enforcedMocks };
}

/** separate node builtin modules from the external modules
* and adds modules that are allowed to have by default
* @param { string[] } requiredModules the modules array from the extension package data
* @param { string } extensionPath
*/
function handelModules(requiredModules, extensionPath)
{
  const builtin = [];
  const externalMocks = {};

  // modules that are allowed by default for being used
  // regularly in node apps and harmless to the user
  builtin.push('path');

  if (requiredModules)
  {
    // loop through all the listed modules
    for (let i = 0; i < requiredModules.length; i++)
    {
      const isBuiltin = getIsBuiltin(requiredModules[i]);

      if (isBuiltin)
      {
        builtin.push(requiredModules[i]);
      }
      else
      {
        externalMocks[requiredModules[i]] = require(join(extensionPath, 'node_modules', requiredModules[i]));
      }
    }
  }

  return { builtin, externalMocks };
}

/** checks if a module is a node builtin module or an external
* @returns { boolean }
*/
function getIsBuiltin(moduleName)
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