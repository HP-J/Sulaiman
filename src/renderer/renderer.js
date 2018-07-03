import { remote } from 'electron';

import { appendTheme } from './theme.js';

import * as page from './page.js';
import * as searchBar from './searchBar.js';

import { init } from './registry.js';

const mainWindow = remote.getCurrentWindow();

// TODO move themes as normal extensions
// so they can be controlled and updated with extensions manager
// append page and search bar and make them invisible
// show splash screen then start loading all the extensions
// create a registry option for extensions that only need
// to run once but make sure they can't register for events
// when all the extensions are loaded make page and search bar visible
// and remove the splash screen

// TODO check for sulaiman updates and download packages on AppImages, Windows, and DMG

// TODO auto-start as an extension

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

/** an event callback, gets called when the application gets focus
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

appendTheme('default', () =>
{
  // create and append search bar block
  searchBar.append();

  // create and append page block
  page.append();

  // register elements events and track key presses
  registerEvents();

  // reset the application focus
  focus();

  // load the extensions
  init();
});