import { NodeVM } from 'vm2';

import { readFileSync, readdirSync, existsSync } from 'fs';

import { join } from 'path';
import { EventEmitter } from 'events';

import { registerPhrase, unregisterPhrase, isRegisteredPhrase } from './searchBar.js';
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
* @property { string[] } permissions
* @property { string[] } modules
* @property { Object.<string, string> } credits
*/

const electron = require('electron');

const eventTarget = new EventEmitter();

/** an array of all the extensions that loaded
* @type { Object.<string, PackageData> } }
*/
export const loadedExtensions = {};

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
  * @param { (text: string) => void } callback the callback function
  */
  ready: (callback) => eventTarget.addListener('ready', callback),
  /** emits every time the user writes something into the search bar
  * @param { (text: string) => void } callback the callback function
  */
  input: (callback) => eventTarget.addListener('input', callback),
  /** returns a card that is shown and hidden automatically
  * when the user search for a certain phrase
  * @param { string } phrase
  * @param { (...args: string[]) => void } [callback] if defined will be called every time the card is shown with any arguments following the chosen phrase
  * @returns { Card }
  */
  phrase: (phrase, callback) => registerPhrase(phrase, callback),
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
  /** emits when the app is fully loaded and ready to use
  * @param { (text: string) => void } callback the callback function
  */
  ready: (callback) => eventTarget.removeListener('ready', callback),
  /** emits every time the user writes something into the search bar
  * @param { (text: string) => void } callback the callback function
  */
  input: (callback) => eventTarget.removeListener('input', callback),
  /** removes a phrase and returns a card controlled by you
  * @param { Card } card the card previously given you by registering a phrase
  */
  phrase: (card) => unregisterPhrase(card),
  /** emits every time the sulaiman app regain focus
  * @param { () => void } callback the callback function
  */
  focus: (callback) => eventTarget.removeListener('focus', callback),
  /** emits every time the sulaiman app loses focus
  * @param { () => void } callback the callback function
  */
  blur: (callback) => eventTarget.removeListener('blur', callback)
};

export const is =
{
  /** returns true when the app is fully loaded and ready to use
  */
  ready: () => readyState,
  /** returns true if a phrase is already registered
  * @param { string } phrase
  */
  registeredPhrase: (phrase) => isRegisteredPhrase(phrase)
};

export const emit =
{
  ready: () => eventTarget.emit('ready'),
  /** @param { string } text
  */
  input: (text) => eventTarget.emit('input', text),
  focus: () => eventTarget.emit('focus'),
  blur: () => eventTarget.emit('blur')
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

  return vm;
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

  };

  // override specific apis from any module or the entire module
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
      if (requiredPermissions[i] === 'process')
        sandbox.process = process;
      
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