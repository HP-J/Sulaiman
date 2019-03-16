import { NodeVM } from 'vm2';

import { readFileSync, readdirSync, existsSync } from 'fs';

import { join } from 'path';
import { platform } from 'os';
import { EventEmitter } from 'events';

import { appendCard, removeCard } from './api.js';
import { readyState, toggleCollapse } from './renderer.js';
import { internalCreateCard as createCard } from './card.js';
import { registerPhrase, unregisterPhrase, isRegisteredPhrase } from './search.js';
import { extensionRemoveCard } from './manager.js';

/** @typedef { import('./card.js').default } Card
*/

/** @typedef { import('./search.js').PhraseEvents } PhraseEvents
*/

/** @typedef { Object } PackageData
* @property { string } name
* @property { string } version
* @property { string } description
* @property { SulaimanData } sulaiman
*/

/** @typedef { Object } SulaimanData
* @property { string } displayName
* @property { string[] } platform
* @property { boolean } theme
* @property { string[] } permissions
* @property { string[] } modules
* @property { Object.<string, string> } credits
*/

/** @typedef { Object } ThemeFunctions
* card functions that are handled by themes
* @property { (card: Card) => boolean } isFastForward
* @property { (card: Card, force: boolean) => boolean } toggleFastForward
* @property { (card: Card) => boolean } isCollapsed
* @property { (card: Card) => void } collapse
* @property { (card: Card) => void } expand
*/

const sulaiman = new EventEmitter();

const extensionsDirectory = join(__dirname, '../extensions/');

export let themeName;

/** @type { ThemeFunctions }
*/
export const themeFunctions = {};

/** an array of all the extensions that loaded
* @type { Object.<string, PackageData> } }
*/
export const loadedExtensions = {};

export const on =
{
  /** emits once when the app is fully loaded and ready to use
  * @param { () => void } callback the callback function
  */
  ready: (callback) => (readyState) ? callback() : sulaiman.addListener('ready', callback),
  /** register a phrase, then returns a card controlled only by the search system
  * @param { string | RegExp } phrase phrase or a regex that the user have to enter to activate this phrase functionality
  * @param { string[] } [defaultArgs]
  * an array of possible arguments like: the 'Tray' in 'Options Tray',
  * will be overridden by search callback if it returns a string array
  * @param { PhraseEvents } [on] phrase-related events
  * @returns { Promise<Card> }
  */
  phrase: (phrase, defaultArgs, on) => registerPhrase(createCard(), phrase, defaultArgs, on),
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

export function getPlatform()
{
  const p = platform();

  if (p === 'linux')
    return 'Linux';
  else if (p === 'win32')
    return 'Windows';
  else if (p === 'darwin')
    return 'macOS';
  else
    return p;
}

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
    scriptPath = join(extensionPath, 'index.js');

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

    const validated = validateExtension(data);

    if (validated)
    {
      if (validated.card)
        appendCard(validated.card);

      if (validated.abort)
        continue;
    }

    // set the theme name property to this theme
    if (data.sulaiman.theme)
      themeName = data.name;

    // create a vm for the extension
    const vm = createVM(data, extensionPath);
      
    // run the extension index script
    vm.run(readFileSync(scriptPath).toString(), scriptPath);

    // append the extension that just loaded to the loaded extensions array
    loadedExtensions[data.name] = data;
  }
}

/** @param { string } warning
* @param { PackageData } abortedData
* @param { PackageData } [runningData]
*/
function loadingAbortedCard(warning, abortedData, runningData)
{
  const card = createCard();

  card.appendText(warning, { style: 'Bold', size: 'Small' });
  card.appendLineBreak();

  const abortedCard = createCard();
  
  extensionRemoveCard(abortedCard, abortedData);

  card.appendChild(abortedCard);
  card.appendLineBreak();

  toggleCollapse(abortedCard, undefined, true, true);
  
  if (runningData)
  {
    const runningCard = createCard();

    extensionRemoveCard(runningCard, runningData);

    card.appendChild(runningCard);
    card.appendLineBreak();

    toggleCollapse(runningCard, undefined, true, true);
  }

  const dismissButton = createCard();
  
  dismissButton.setType({
    type: 'Button',
    title: 'Dismiss',
    callback: () => removeCard(card)
  });

  card.appendChild(dismissButton);

  return card;
}

/** @param { PackageData } data
 * @returns { { card: Card, abort: boolean } }
*/
function validateExtension(data)
{
  // if the package doesn't have name,
  // is the only case where we can abort from loading without a explanation
  if (!data.name)
    return { abort: true };

  if (!data.version)
    data.version = '1.0.0';

  if (!data.sulaiman)
    data.sulaiman = {};

  if (!data.sulaiman.displayName)
    data.sulaiman.displayName = data.name;

  // already loaded with the same name
  if (loadedExtensions[data.name])
  {
    const runningData = loadedExtensions[data.name];

    return {
      card: loadingAbortedCard(
        'There\'s two extensions with duplicate package names',
        data, runningData),
      abort: true
    };
  }

  // incompatible platform
  if (data.sulaiman.platform && !data.sulaiman.platform.includes(platform()))
  {
    return {
      card: loadingAbortedCard(getPlatform() + ' is not supported by the this extension', data),
      abort: true
    };
  }

  // handle conflicting themes (more than one extension want theme permissions)
  if (data.sulaiman.theme && themeName)
  {
    const runningData = loadedExtensions[themeName];

    return {
      card: loadingAbortedCard(
        runningData.sulaiman.displayName + ' is the running theme\n' + data.sulaiman.displayName + ' load aborted',
        data, runningData),
      abort: true
    };
  }
}

/** creates a new NodeVM for an extension
* @param { PackageData } data
* @param { string } extensionPath
*/
function createVM(data, extensionPath)
{
  const { sandbox, defaultMockups } = handelMockups(data.sulaiman.permissions, data.sulaiman.theme || false);

  // separate node builtin modules from the external modules
  const { builtin, externalMockups } = handelModules(data.sulaiman.modules, extensionPath);

  const mockups = { ...defaultMockups, ...externalMockups };

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
      mock: mockups,
      // sandbox mean all modules and local files are applied to the rules of the vm,
      // however modules that are accepted by the user on installing an extension, get required
      // from outside of the vm and are imported to the vm as mock ups
      context: 'sandbox'
    }
  });

  return vm;
}

/** handle permissions to use global variables and mockups
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
  const defaultMockups =
  {
    sulaiman: { ...require('./api.js') }
  };

  const permissions =
  {
    // global properties and functions
    document: true,
    process: true,

    // sulaiman properties and functions
    browserWindow: true,
    clipboard: true,
    shell: true,
    dialog: true,
    tray: true
  };

  // allow normal permissions
  for (let i = 0; i < requiredPermissions.length; i++)
  {
    if (permissions[requiredPermissions[i]])
      permissions[requiredPermissions[i]] = false;
  }

  // theme permissions
  permissions.setThemeFunctions = !theme;
  permissions.appendStyle = !theme;
  permissions.removeStyle = !theme;
  permissions.appendStyleDir = !theme;
  permissions.setPlaceholder = !theme;

  // delete the un-given permissions from the VM mockups and sandbox
  for (const key in permissions)
  {
    if (permissions[key])
    {
      if (sandbox[key])
        sandbox[key] = undefined;
      else if (defaultMockups.sulaiman[key])
        defaultMockups.sulaiman[key] = undefined;
    }
  }

  // properties and functions that are always allowed for being used
  // regularly in most apps, and are harmless to the user

  if (!sandbox.document)
  {
    sandbox.document = {
      createElement: document.createElement.bind(document),
      createElementNS: document.createElementNS.bind(document),
      createTextNode: document.createTextNode.bind(document)
    };
  }

  sandbox.setTimeout = (callback, delay, ...args) =>
  {
    const timer = setTimeout(() =>
    {
      callback.apply(undefined, ...args);
    }, delay);

    return timer;
  };

  sandbox.setInterval = (callback, delay, ...args) =>
  {
    const timer = setInterval(() =>
    {
      callback.apply(undefined, ...args);
    }, delay);

    return timer;
  };

  sandbox.getComputedStyle = (elt, pseudoElt) =>
  {
    return getComputedStyle(elt, pseudoElt);
  };
  
  return { sandbox, defaultMockups };
}

/** separate node builtin modules from the external modules
* and adds modules that are allowed to have by default
* @param { string[] } requiredModules the modules array from the extension package data
* @param { string } extensionPath
*/
function handelModules(requiredModules, extensionPath)
{
  const builtin = [];
  const externalMockups = {};

  if (requiredModules)
  {
    // loop through all the listed modules
    for (let i = 0; i < requiredModules.length; i++)
    {
      const isBuiltin = getIsBuiltin(requiredModules[i]);

      if (isBuiltin)
        builtin.push(requiredModules[i]);
      else
        externalMockups[requiredModules[i]] = require(join(extensionPath, 'node_modules', requiredModules[i]));
    }
  }

  // modules that are allowed by default for being used
  // regularly in most apps, and are harmless to the user
  if (!builtin.includes('path'))
    builtin.push('path');

  return { builtin, externalMockups };
}

/** checks if a module is a node builtin module or an external
* @returns { boolean }
*/
function getIsBuiltin(moduleName)
{
  // I found this code somewhere in a stack overflow question
  // but I can't find it again to credit who wrote it
  
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