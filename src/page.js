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

  return (buttonMinY < pageMaxY) && (buttonMaxY >= 0);
}

export function load()
{
  domElement = require.block(undefined, 'page');
  document.body.appendChild(domElement);

  topHideout = require.block('topHideout');
  domElement.appendChild(topHideout);
  
  botHideout = require.block('botHideout');
  domElement.appendChild(botHideout);
  
  domElement.onscroll = onScroll;
    
  // init top and bottom hideouts
  onScroll();
}

/** @param { UIEvent } event 
*/
function onScroll(event)
{
  // if (buttons.length > 0)
  {
    // console.log('0 is ' + isVisible(buttons[0]) + ' and 14 is ' + isVisible(buttons[10]));
    
    // const topHeight = domElement.scrollTop;
    // const botHeight = domElement.scrollHeight - topHeight;

    // const topHeight = 129;
    // const botHeight = domElement.scrollHeight - topHeight;

    // todo use the topScroll to calc how far is the top hide out is
    // topHeight os topScroll
    // while botScroll is is scrollHeight - topHeight

    // for (let i = 0; i < buttons.length; i++)
    // {
      
    // console.log(i);

    // if (i === 0 || i === 10)
    //   console.log(isVisible(buttons[i]));

    // const element = array[i];

    // if (isVisible(buttons[i].domElement))
    //   buttons[i].domElement.style.display = 'block';
    // else
    //   buttons[i].domElement.style.display = 'none';

    // console.log(i + ': ' + isVisible(buttons[i].domElement));
    // }
  }
  // else
  {
    // topHideout.style.display =  botHideout.style.display = 'none';
    // topHideout.style.width =  botHideout.style.width = 'none';
  }
}

/** list the required buttons on the page block using a reactive elements
* @param { ButtonMeta[] } meta 
*/
export function list(meta)
{
  domElement.scrollTop = 0;

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