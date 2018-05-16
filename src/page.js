import * as require from './require.js';

import { Button, ButtonMeta } from './button.js';

/** @type { HTMLDivElement }
*/
let topHideout;

/** @type { HTMLDivElement }
*/
let botHideout;

/** @type { HTMLDivElement }
*/
export let domElement;

/** an array of the buttons that has been initialized
* @type { Button[] }
*/
const buttons = [];

export function load()
{
  domElement = require.block(undefined, 'page');
  document.body.appendChild(domElement);

  topHideout = require.block();
  // domElement.appendChild(topHideout);
  
  botHideout = require.block();
  // document.body.appendChild(botHideout);
  
  domElement.onscroll = onScroll;
    
  // init top and bottom hideouts
  onScroll();
}

function getStyle(elm, rule)
{
  return Math.round(parseFloat(window.getComputedStyle(elm)[rule].replace('px', '')));
}

/** @param { HTMLButtonElement } button 
*/
function isVisible(button)
{
  const pageRect = domElement.getBoundingClientRect();
  const buttonRect = button.domElement.getBoundingClientRect();

  const pageMinY = Math.round(pageRect.top);
  const pageMaxY = Math.round(pageRect.height);
  const buttonMinY = Math.round(buttonRect.top) - pageMinY;
  const buttonMaxY = (Math.round(buttonRect.top) - pageMinY) + Math.round(buttonRect.height);

  return (buttonMinY < pageMaxY) && (buttonMaxY >= 0) ? 'inside' : 'outside';
}

/** @param { UIEvent } event 
*/
function onScroll(event)
{
  if (buttons.length > 0)
  {
    console.log('0 is ' + isVisible(buttons[0]) + ' and 14 is ' + isVisible(buttons[14]));
  }
  else
  {
    // topHideout.style.visibility =  botHideout.style.visibility = 'hidden';
  }
}

/** list the required buttons on the page block using a reactive elements
* @param { ButtonMeta[] } meta 
*/
export function list(meta)
{
  const length = (meta.length > buttons.length) ? meta.length : buttons.length;

  for (let i = 0; i < length; i++)
  {
    if (i >= meta.length)
    {
      // console.log('deactivate a button');

      // const height = parseInt(window.getComputedStyle(buttons[i].domElement).height.replace('px', ''));
      // console.log(height);

      buttons[i].domElement.style.display = 'none';
    }
    else if (i < buttons.length)
    {
      // console.log('reactivate and update a button');

      // buttons[i].update(meta[i]);
      
      buttons[i].domElement.style.display = 'block';
    }
    else
    {
      // console.log('create a new button');
      
      const button = new Button(meta[i]);
      buttons.push(button);

      domElement.appendChild(button.domElement);
    }
  }
}