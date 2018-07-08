import { remote } from 'electron';

import * as searchBar from './searchBar.js';

import { loadExtensionsDir, emitCallbacks } from './registry.js';

import { hideSplashScreen, Block, appendBlock } from './extension.js';

export const splash = document.body.children[0];

export const mainWindow = remote.getCurrentWindow();

// TODO Extensions Control Room

// TODO Extension Ideas
// apps
// calculator
// files
// google
// check for sulaiman updates and download packages on AppImages, Windows, and DMG
// auto-start

function registerEvents()
{
  mainWindow.on('focus', onfocus);
  mainWindow.on('blur', onblur);

  // back-arrow 37
  // up-arrow 38
  // forward-arrow 39
  // down-arrow 40

  window.onkeydown = (event) =>
  {
    // TAB
    if (event.keyCode === 9)
      event.preventDefault();
  };

  window.onkeyup = () =>
  {
    // F5
    if (event.keyCode === 116)
      mainWindow.reload();
  };

  // window.onkeypress = () =>
  // {
  // };
}

/** gets called when the application gets focus
*/
function onfocus()
{
  // emits the event to extensions
  emitCallbacks('onFocus');
}

/** gets called when the application gets unfocused
*/
function onblur()
{
  if (!process.env.DEBUG)
    mainWindow.hide();
  
  // emits the event to extensions
  emitCallbacks('onBlur');
}

// create and append search bar block
searchBar.append();
    
// register elements events and track key presses
registerEvents();

// load all extensions
loadExtensionsDir();

// reset focus
onfocus();

// set a timeout to hide the splash screen to give a chance to
// extensions that leverages it to hide it themselves
setTimeout(() =>
{
  hideSplashScreen();
}, 10000);