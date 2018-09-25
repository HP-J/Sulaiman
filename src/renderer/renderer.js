import { remote } from 'electron';

import { join } from 'path';

import { appendSearchBar, registerPhrase, unregisterPhrase, isRegisteredPhrase, search, compare, getStringDefaultRegex } from './search.js';
import { loadExtensions, emit, } from './loader.js';
import { autoHide, loadOptions, registerOptionsPhrase } from './options.js';

import { loadNPM } from './manager.js';
import { createCard } from './card.js';

const { mainWindow } = remote.require(join(__dirname, '../main/window.js'));

export let readyState = false;

const splash = document.body.children[0];

/** executes the callback when the DOM has completed any running operations
* @param { () => void } callback
*/
export function isDOMReady(callback)
{
  if (document.readyState === 'complete')
    callback();
  else
    window.setTimeout(() =>
    {
      isDOMReady(callback);
    }, 100);
}

/** register to several events the app uses
*/
function registerEvents()
{
  mainWindow.on('focus', onfocus);
  mainWindow.on('blur', onblur);
  mainWindow.on('blur', onblur);

  window.addEventListener('beforeunload', () =>
  {
    remote.globalShortcut.unregisterAll();
  });

  window.addEventListener('keydown', (event) =>
  {
    if (event.key === 'Tab')
      event.preventDefault();
  });
}

function registerPhrases()
{
  registerOptionsPhrase();
}

/** gets called when the application gets focus
*/
function onfocus()
{
  emit.focus();
}

/** gets called when the application gets unfocused
*/
function onblur()
{
  if (autoHide)
    mainWindow.hide();
  
  emit.blur();
}

// create and append the search bar
appendSearchBar();
    
// register to several events the app uses
registerEvents();

// load npm
loadNPM();

// mark the app as ready to create built-in content
readyState = true;

// load options
// loadOptions();

// register sulaiman-related phrases
// registerPhrases();

// mark the app as not-ready to load all extensions
readyState = false;

// load all extensions
loadExtensions();

// finally, mark the app as ready and
// emit the ready event
readyState = true;
emit.ready();

// registerPhrase('hello')
//   .then((obj) =>
//   {
//     console.log('added');
//   });

// on.phrase('extension',
//   [
//     'delete',
//     'install',
//     'running'
//   ], (argument, value) =>
//   {
//     console.log(argument.length + ' = ' + value.length);
//   }, () =>
//   {
//     console.log('entered');
//   });

// remove the splash screen when the dom is ready
isDOMReady(() =>
{
  if (splash)
    document.body.removeChild(splash);

  // reset focus
  onfocus();
});