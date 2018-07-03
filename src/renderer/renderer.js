import { remote } from 'electron';

import * as page from './page.js';
import * as searchBar from './searchBar.js';

import { loadExtensions } from './registry.js';
import { hideSplashScreen } from './extension.js';

export const splash = document.body.getElementsByClassName('splash')[0];

export const mainWindow = remote.getCurrentWindow();

// TODO Extensions Control Room
// TODO check for sulaiman updates and download packages on AppImages, Windows, and DMG

// TODO Extension Ideas
// apps
// calculator
// files
// google
// auto-start

function registerEvents()
{
  mainWindow.on('focus', focus);
  mainWindow.on('blur', blur);

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
function focus()
{
  searchBar.focus();
}

/** an event callback, gets called when the application gets unfocused
*/
function blur()
{
  // mainWindow.hide();
}

// create and append search bar block
searchBar.append();
    
// create and append page block
page.append();
    
// register elements events and track key presses
registerEvents();

// start focus
focus();
  
// load all extensions
loadExtensions();

// set a timeout to hide the splash screen to give a chance to
// extensions that leverages it to hide it themselves
setTimeout(() =>
{
  hideSplashScreen();
}, 10000);