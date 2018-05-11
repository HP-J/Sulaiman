import { remote, screen } from 'electron';

const currentWindow = remote.getCurrentWindow();
const screenSize = screen.getPrimaryDisplay().workAreaSize;

/** @param { number } number 
* @param { number } p 
*/
function mp(number, p)
{
  return Math.floor(number * (p / 100));
}

const size =
{
  x: mp(screenSize.width, 50),
  yOpened: mp(screenSize.height, 70),
  yClosed: mp(screenSize.height, 7),
};

const location =
{
  x: Math.floor((screenSize.width - size.x) / 2),
  y: Math.floor((screenSize.height - size.yOpened) / 2),
};

/** @param { HTMLElement } oElm 
* @param { string } strCssRule 
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

/** @param { string } s 
* @param { number } startIndex 
* @param { number } endIndex 
*/
function remove(s, startIndex, endIndex)
{
  return s.substring(0, startIndex) + s.substring(endIndex);
}

let input, placeholder;

function init()
{
  currentWindow.setSize(size.x, size.yOpened);
  currentWindow.setPosition(location.x, location.y);

  input = document.getElementById('input');
  placeholder = document.getElementById('placeholder');

  placeholder.value = placeholder.current = placeholder.default = 'Search';

  const inputPaddingLeft = parseInt(getStyle(input, 'left').replace(/\D/g, ''));

  input.style.width = placeholder.style.width = (size.x - (inputPaddingLeft * 2)) + 'px';
  input.style.height = placeholder.style.height = size.yClosed + 'px';
  input.style.fontSize = placeholder.style.fontSize  = (size.yClosed / 2) + 'px';

  input.oninput = () =>
  {
    if (placeholder.value.length > 0)
      placeholder.value = input.value + remove(placeholder.current, 0, input.value.length);
    else
      placeholder.value = placeholder.current = placeholder.default;
  };

  // currentWindow.openDevTools();

  input.focus();

  // TODO if the app lost focus, hide it

  // window.onkeyup = (event) =>
  // {
  //   if (event.keyCode === 27)
  //     currentWindow.close();
  // };
}

init();