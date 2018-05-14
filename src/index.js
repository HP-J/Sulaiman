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

/** the placeholder that will show auto-complete
* @type { HTMLInputElement }
*/
let placeholder;

/** the element the user will use to write
* @type { HTMLInputElement }
*/
let input;

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

  // create and append search bar block
  searchBar = requireBlock('searchBar');
  document.body.appendChild(searchBar);

  // create and append search bar's input and placeholder boxes
  createBar();

  // create and append page block
  page = requireBlock('page');
  document.body.appendChild(page);

  // register elements events and track key presses
  registerEvents();

  // reset the application focus
  focus();
}

/** remove a piece of a string using indies
* @param { string } s 
* @param { number } startIndex 
* @param { number } endIndex 
*/
function remove(s, startIndex, endIndex)
{
  return s.substring(0, startIndex) + s.substring(endIndex);
}

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

/** @param { string } id
*/
function requireBlock(id)
{
  const div = document.createElement('div');
  
  div.id = id;

  return div;
}

/** @param { Object.<string, string> } options 
*/
function requireInput(options)
{
  const input = document.createElement('input');

  input.setAttribute('type', 'text');

  input.id = options.id || '';
  input.className = options.class || '';
  input.readOnly = (options.readOnly === undefined) ? true : false;

  return input;
}

function createBar()
{
  // create the elements from dom
  placeholder = requireInput({ id: 'searchBarPlaceholder' });
  input = requireInput({ id: 'searchBarInput', readOnly: false });

  // append the bar to dom
  searchBar.appendChild(placeholder);
  searchBar.appendChild(input);

  // return the default placeholder value, when the input value is empty
  placeholder.value = placeholder.current = placeholder.default = 'Search';
}

function registerEvents()
{
  // * element specific events

  // when the user change the text in search bar call updatePlaceholder()
  input.oninput = updatePlaceholder;

  // when the application  gets focus and unfocused
  mainWindow.on('focus', focus);
  mainWindow.on('blur', blur);

  // * register hotkeys & the navigation keys

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

/** @param { SVGSVGElement } icon 
* @param { SVGSVGElement } action 
*/
function requireButton(icon, action)
{
  const button = document.createElement('button');
  button.className = 'button';

  next.setAttribute('class', 'icon');
  button.appendChild(next);

  const next2 = next.cloneNode(true); 

  next2.setAttribute('class', 'action');
  button.appendChild(next2);

  const title = requireInput({ class: 'buttonTitle' });
  button.appendChild(title);

  const description = requireInput({ class: 'buttonDescription' });
  button.appendChild(description);


  // const description;

  return button;
}

init();

const button = requireButton(next);

// next.setAttribute('class', 'icon-normal');

page.appendChild(button);