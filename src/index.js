import { remote } from 'electron';

import { load } from './theme.js';

import * as page from './page.js';
import * as searchBar from './searchBar.js';

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
    
    // F5
    if (event.keyCode === 116)
      mainWindow.reload();
  };

  window.onkeyup = (event) =>
  {
    // event.preventDefault();
  };

  window.onkeypress = (event) =>
  {
    // event.preventDefault();
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
  throw new Error('Sorry, this app does not support window.eval().');
};

// append the style, load the visuals
load('dark');

// create and append search bar block
searchBar.load();

// create and append page block
page.load();

// register elements events and track key presses
registerEvents();

// reset the application focus
focus();