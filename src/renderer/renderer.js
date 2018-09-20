import { remote } from 'electron';

import { join } from 'path';

import { appendSearchBar, registerPhrase, unregisterPhrase } from './newsearch.js';
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

// load all extensions
loadExtensions();

// mark the app as ready
readyState = true;

// load options
// loadOptions();

// register sulaiman-related phrases
// registerPhrases();

// emit the ready event for extensions
emit.ready();

const card = registerPhrase('hello');

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