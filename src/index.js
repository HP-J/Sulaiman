import { remote } from 'electron';

import { load, visuals } from './theme.js';

import * as page from './page.js';
import * as searchBar from './searchBar.js';

const mainWindow = remote.getCurrentWindow();

function registerEvents()
{
  // when the application  gets focus and unfocused
  mainWindow.on('focus', focus);
  mainWindow.on('blur', blur);

  // back-arrow 37
  // up-arrow 38
  // forward-arrow 39
  // down-arrow 40
  // tab 9

  window.onkeydown = (event) =>
  {
    if (event.keyCode === 9)
      event.preventDefault();
    
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

function focus()
{
  searchBar.focus();
}

function blur()
{
  mainWindow.hide();
}

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