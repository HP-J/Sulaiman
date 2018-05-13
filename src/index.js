import { remote, screen, ipcRenderer } from 'electron';

import requireSVG from './requireSVG.js';

const mainWindow = remote.getCurrentWindow();

const next = requireSVG('../resources/next.svg');

/** the parent of the search bar 
* @type { HTMLDivElement }
*/
let searchBar;

/** the parent of every search results and add-on pages
* @type { HTMLDivElement }
*/
let page;

/** the element the user will use to write
* @type { HTMLInputElement }
*/
let input;

/** the placeholder that will show auto-complete
* @type { HTMLInputElement }
*/
let placeholder;

/** what happen when the app restores focus
*/
function focus()
{
  input.focus();
}

/** what happen when the app restores loses focus
*/ 
function blur()
{
  mainWindow.hide();

  input.value = '';
  updatePlaceholder();
}

/** remove a piece of a string with indies
* @param { string } s 
* @param { number } startIndex 
* @param { number } endIndex 
*/
function remove(s, startIndex, endIndex)
{
  return s.substring(0, startIndex) + s.substring(endIndex);
}

/** update the placeholder when the user writes into input
*/
function updatePlaceholder()
{
  if (placeholder.value.length > 0)
    placeholder.value = input.value + remove(placeholder.current, 0, input.value.length);
  else
    placeholder.value = placeholder.current = placeholder.default;
}

function logToMain(args)
{
  ipcRenderer.send('async', args);
}

/** what happens when the app first starts the renderer-process
*/
function init()
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

  // create and append search bar and page div blocks

  searchBar = requireBlock('searchBar');
  document.body.appendChild(searchBar);

  page = requireBlock('page');
  document.body.appendChild(page);

  // create and append search bar's input and placeholder boxes
  createBar();

  // registerEvents();

  // reset the focus
  // focus();
}

/** @param { string } className 
*/
function requireBlock(className)
{
  const div = document.createElement('div');
  
  div.className = className;

  return div;
}

/** @param { string } className 
* @param { boolean } readOnly 
*/
function requireInput(className, readOnly)
{
  const input = document.createElement('input');

  input.setAttribute('type', 'text');

  input.className = className;
  input.readOnly = readOnly;

  return input;
}

function createBar()
{
  // create the elements from dom
  input = requireInput('searchBarInput', false);
  placeholder = requireInput('searchBarPlaceholder', true);

  // append the bar to dom
  searchBar.appendChild(input);
  searchBar.appendChild(placeholder);

  // return the default placeholder value, when the input value is empty
  placeholder.value = placeholder.current = placeholder.default = 'Search';
}

function registerEvents()
{
  // register the onInput event with updatePlaceholder() function
  input.oninput = updatePlaceholder;

  // currentWindow.openDevTools();

  // register the focus and blur events with their functions
  mainWindow.on('focus', focus);
  mainWindow.on('blur', blur);

  // register the navigation keys

  // back-arrow 37
  // up-arrow 38
  // forward-arrow 39
  // down-arrow 40

  window.onkeydown = (event) =>
  {
    event.preventDefault();
  };

  window.onkeyup = (event) =>
  {
    event.preventDefault();
  };

  window.onkeypress = (event) =>
  {
    event.preventDefault();
  };
}

// function requireButton()
// {
//   const button = document.createElement('button');
//   button.className = 'button';

//   return button;
// }

// function createButton()
// {
//   const div = requireButton();;

//   div.style.top = size.yBar + 'px';

//   div.style.left = 0;

//   div.style.width = size.x + 'px';
//   div.style.height = buttonHeight + 'px';

//   // div.style.visibility = 'hidden';

//   document.body.appendChild(div);

//   next.setAttribute('preserveAspectRatio', 'xMinYMin meet');
//   next.setAttribute('class', 'icon-normal');

//   next.style.position = 'absolute';
//   // next.style.top = ((buttonHeight - iconWidth) / 2) + 'px';
//   // TODO fix
//   next.style.top = 'calc((' + buttonHeight + 'px - 4vw) / 2);';

//   div.appendChild(next);
// }

init();
// createButton();
