import { remote, screen, ipcRenderer } from 'electron';

import { load } from './theme.js';

import * as page from './page.js';
import * as searchBar from './searchBar.js';

// import Button from './button.js';

const mainWindow = remote.getCurrentWindow();

function resize()
{
  // set the electron window size
  // window's width is 50% of the screen's width
  // window's height is 70% of the screen's height

  const screenSize = screen.getPrimaryDisplay().workAreaSize;

  const sizeX = Math.floor(screenSize.width * (50 / 100));
  const sizeY = Math.floor(screenSize.height * (70 / 100));

  mainWindow.setSize(sizeX, sizeY);

  // set the electron window location
  // center of the screen

  mainWindow.setPosition(
    Math.floor((screenSize.width - sizeX) / 2),
    Math.floor((screenSize.height - sizeY) / 2)
  );
}

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

export function logToMain(args)
{
  ipcRenderer.send('async', args);
}

// append the style, load the visuals
load('dark');

// fit the screen
resize();

// create and append search bar block
searchBar.load();

// create and append page block
page.load();

// register elements events and track key presses
registerEvents();

// const button = new Button();
// page.domElement.appendChild(button.domElement);

// reset the application focus
focus();