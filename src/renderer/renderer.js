import { remote } from 'electron';

import { bindStyles } from './theme.js';

import * as page from './page.js';
import * as searchBar from './searchBar.js';

import { init } from './registry.js';

const mainWindow = remote.getCurrentWindow();

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

  window.onkeypress = () =>
  {
  };
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

// disable eval
window.eval = global.eval = () =>
{
  throw new Error('this app does not support evil');
};

// load the styles
bindStyles('default', () =>
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