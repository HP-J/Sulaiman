import { remote } from 'electron';

import { join } from 'path';

import { appendSearchBar, registerPhrase } from './search.js';
import { loadExtensions, emit } from './loader.js';
import { autoHide, loadOptions, registerOptionsPhrases } from './options.js';

import { loadNPM } from './manager.js';

const { mainWindow, quit, reload, relaunch } = remote.require(join(__dirname, '../main/window.js'));

export let readyState = true;

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

function registerBuiltinPhrases()
{
  // const quitPhrase = registerPhrase('Quit', undefined, () => false, () => quit());
  // const reloadPhrase = registerPhrase('Reload', undefined, () => false, () => reload());
  // const relaunchPhrase = registerPhrase('Relaunch', undefined, () => false, () => relaunch());

  // const optionsPhrase = registerOptionsPhrases();

  // return Promise.all([ quitPhrase, reloadPhrase, relaunchPhrase, optionsPhrase ]);
  return Promise.all([ registerPhrase('launch', [ 'discord' ]), registerPhrase('Reload') ]);
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

function ready()
{
  // mark the app as not-ready to load all extensions
  readyState = false;

  // load all extensions
  loadExtensions();

  // finally, mark the app as ready and
  // emit the ready event
  readyState = true;

  emit.ready();

  // remove the splash screen when the dom is ready
  isDOMReady(() =>
  {
    if (splash)
      document.body.removeChild(splash);

    // reset focus
    onfocus();
  });
}

// create and append the search bar
appendSearchBar();
    
// register to several events the app uses
registerEvents();

// load npm
loadNPM();

// load options
loadOptions();

// register sulaiman-related phrases
registerBuiltinPhrases().then(ready);