import { remote } from 'electron';

import { join } from 'path';

import { appendSearchBar, internalRegisterPhrase as registerPhrase } from './search.js';
import { loadExtensions, emit } from './loader.js';
import { autoHide, loadOptions, registerOptionsPhrase } from './options.js';

import { loadNPM, registerExtensionsPhrase } from './manager.js';

const { mainWindow, quit, reload, relaunch } = remote.require(join(__dirname, '../main/window.js'));

export let readyState = false;

const splash = document.body.children[0];

/** emit once, when the DOM has completed any running operations
* @param { () => void } callback
*/
function isDOMReady(callback)
{
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', callback, { once: true });
  else
    callback();
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
  const quitPhrase = registerPhrase('Quit', undefined, undefined, () => quit());
  const reloadPhrase = registerPhrase('Reload', undefined, undefined, () => reload());
  const relaunchPhrase = registerPhrase('Relaunch', undefined, undefined, () => relaunch());

  const optionsPhrase = registerOptionsPhrase();
  const extensionsPhrase = registerExtensionsPhrase();

  return Promise.all([ quitPhrase, reloadPhrase, relaunchPhrase, optionsPhrase, extensionsPhrase ]);
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

// load options
loadOptions();

// load all extensions
loadExtensions();

// register all builtin phrases
registerBuiltinPhrases()
  .then(() =>
  {
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
  });