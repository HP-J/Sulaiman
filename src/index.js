import { remote, screen, ipcRenderer } from 'electron';
// import s from '../resources/next.svg';

import fs from 'fs';
import path from 'path';
import svgload from './svgload.js';

const mainWindow = remote.getCurrentWindow();
const screenSize = screen.getPrimaryDisplay().workAreaSize;

logToMain(svgload('../resources/next.svg'));

/** the element the user will use to write
* @type { HTMLElement }
*/
let input;

/** the placeholder that will show auto-complete
* @type { HTMLElement }
*/
let placeholder;

/** the size of the windows (based on screen-size)
*/
const size =
{
  x: multiPercent(screenSize.width, 50),
  yFull: multiPercent(screenSize.height, 70),
  yBar: multiPercent(screenSize.height, 7),
  yClient: 0
};

/** the size of the windows (based on screen-size and window-size)
*/ 
const location =
{
  x: Math.floor((screenSize.width - size.x) / 2),
  y: Math.floor((screenSize.height - size.yFull) / 2),
};

/** Multiple a number by a percentage
* @param { number } number 
* @param { number } percentage
*/
function multiPercent(number, percentage)
{
  return Math.floor(number * (percentage / 100));
}

/** get a css value from an element
* @param { HTMLElement } oElm the html element
* @param { string } strCssRule the rule you need to extract the value from
*/
function getStyle(oElm, strCssRule)
{
  let strValue = '';
  if(document.defaultView && document.defaultView.getComputedStyle)
  {
    strValue = document.defaultView.getComputedStyle(oElm, '').getPropertyValue(strCssRule);
  }
  else if(oElm.currentStyle)
  {
    strCssRule = strCssRule.replace(/-(\w)/g, function (strMatch, p1)
    {
      return p1.toUpperCase();
    });
    strValue = oElm.currentStyle[strCssRule];
  }
  return strValue;
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

/** what happens when the app first starts the renderer-process
*/
function init()
{
  // set the client size
  size.yClient = size.yFull - size.yBar;

  // set the electron window size
  mainWindow.setSize(size.x, size.yFull);

  // set the electron window location
  mainWindow.setPosition(location.x, location.y);

  // createBar();
  // registerEvents();

  // reset the focus
  // focus();
}

function createBar()
{
  // create the elements from dom
  input = document.createElement('input');
  placeholder = document.createElement('input');

  // set placeholder css' class
  placeholder.className = 'placeholder';

  // input type is text
  input.setAttribute('type', 'text');
  placeholder.setAttribute('type', 'text');

  // placeholder is a read-only
  placeholder.readOnly = true;

  // append the bar to dom
  document.body.appendChild(input);
  document.body.appendChild(placeholder);

  // return the default placeholder value, when the input value is empty
  placeholder.value = placeholder.current = placeholder.default = 'Search';

  // get the input element's padding from css
  const inputPaddingLeft = parseInt(getStyle(input, 'left').replace(/\D/g, ''));

  // set the input and placeholder elements' size and font-size
  input.style.width = placeholder.style.width = (size.x - (inputPaddingLeft * 2)) + 'px';
  input.style.height = placeholder.style.height = size.yBar + 'px';
  input.style.fontSize = placeholder.style.fontSize  = (size.yBar / 2) + 'px';
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
  window.onkeyup = (event) =>
  {
    // back-arrow 37
    // up-arrow 38
    // forward-arrow 39
    // down-arrow 40
  };
}

let buttons = 0;

function createButton()
{
  const div = document.createElement('div');
  div.className = 'button';

  div.style.position = 'absolute';

  div.style.left = 0;
  div.style.top = (size.yBar + (multiPercent(size.yClient, 10) * buttons)) + 'px';

  buttons += 1;

  div.style.width = size.x + 'px';
  div.style.height = multiPercent(size.yClient, 15) + 'px';

  // div.style.visibility = 'hidden';

  document.body.appendChild(div);
}

init();

// logToMain(s);

// createButton();
// createButton();
// createButton();

// createButton();
// createButton();
// createButton();
