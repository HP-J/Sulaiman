import { remote, screen } from 'electron';

const mainWindow = remote.getCurrentWindow();
const screenSize = screen.getPrimaryDisplay().workAreaSize;

/** the box the user will use to write
* @type { HTMLElement }
*/
let input;

/** the placeholder that will show auto-complete
* @type { HTMLElement }
*/
let placeholder;

// the size of the windows (based on screen-size)
const size =
{
  x: multiPercent(screenSize.width, 50),
  yOpened: multiPercent(screenSize.height, 70),
  yClosed: multiPercent(screenSize.height, 7),
};

// the size of the windows (based on screen-size and window-size)
const location =
{
  x: Math.floor((screenSize.width - size.x) / 2),
  y: Math.floor((screenSize.height - size.yOpened) / 2),
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

// what happen when the app restores focus
function focus()
{
  input.focus();
}

// what happen when the app restores loses focus
function blur()
{
  mainWindow.hide();

  input.value = '';
  updatePlaceholder();
}

// update the placeholder when the user writes into input
function updatePlaceholder()
{
  if (placeholder.value.length > 0)
    placeholder.value = input.value + remove(placeholder.current, 0, input.value.length);
  else
    placeholder.value = placeholder.current = placeholder.default;
}

// what happens when the app first starts the renderer-process
function init()
{
  // set the window's size
  mainWindow.setSize(size.x, size.yOpened);

  // set the window's location
  mainWindow.setPosition(location.x, location.y);

  // load the elements from html
  input = document.getElementById('input');
  placeholder = document.getElementById('placeholder');

  // set the default placeholder sentence when the input string is empty
  placeholder.value = placeholder.current = placeholder.default = 'Search';

  // get the input element's padding
  const inputPaddingLeft = parseInt(getStyle(input, 'left').replace(/\D/g, ''));

  // set the input element's size and font-size
  input.style.width = placeholder.style.width = (size.x - (inputPaddingLeft * 2)) + 'px';
  input.style.height = placeholder.style.height = size.yClosed + 'px';
  input.style.fontSize = placeholder.style.fontSize  = (size.yClosed / 2) + 'px';

  // register the onInput event with updatePlaceholder() function
  input.oninput = updatePlaceholder;

  // currentWindow.openDevTools();

  // register the focus and blur events with their functions
  mainWindow.on('focus', focus);
  mainWindow.on('blur', blur);

  // reset the focus
  focus();

  // window.onkeyup = (event) =>
  // {
  //   if (event.keyCode === 27)
  //     currentWindow.close();
  // };
}

init();