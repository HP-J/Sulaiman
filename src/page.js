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

/** @param { Button } button 
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

/** @param { Button } button 
*/
function hide(button)
{
  button.domElement.rect = button.domElement.getBoundingClientRect();
  button.domElement.cache = button.domElement.getBoundingClientRect;

  button.domElement.getBoundingClientRect = function() { return this.rect; };

  buttons[0].domElement.style.display = 'none';
}

/** @param { Button } button 
*/
function show(button)
{
  button.domElement.rect = button.domElement.cache = null;

  button.domElement.getBoundingClientRect = button.domElement.cache;

  buttons[0].domElement.style.display = 'block';
}

export function load()
{
  domElement = require.block(undefined, 'page');
  document.body.appendChild(domElement);

  topHideout = require.block('topHideout');
  // domElement.appendChild(topHideout);
  
  botHideout = require.block('botHideout');
  // domElement.appendChild(botHideout);
  
  domElement.onscroll = onScroll;
    
  // init top and bottom hideouts
  // onScroll();
}

/** @param { UIEvent } event 
*/
export function onScroll()
{
  if (buttons.length > 0)
  {
    // console.log('buttons.length: ' + buttons.length);

    console.log(buttons[0].domElement.getBoundingClientRect().height);
    // console.log(buttons[0].domElement.getBoundingClientRect().width);

    // console.log(isVisible(buttons[0]));
    
    // buttons[0].domElement.style.display = 'none';
    // hide(buttons[0]);

    // console.log(isVisible(buttons[0]));
    // console.log(buttons[0].domElement.getBoundingClientRect().height);
    

    // console.log('0 is ' + isVisible(buttons[0]) + ' and 14 is ' + isVisible(buttons[10]));

    // topHideout.style.height = domElement.scrollTop + 'px';
    // botHideout.style.height = (domElement.scrollHeight - domElement.scrollTop) + 'px';

    // topHideout.style.height = 129 + 'px';
    // botHideout.style.height = (400 - 129) + 'px';

    // todo use the topScroll to calc how far is the top hide out is
    // topHeight os topScroll
    // while botScroll is is scrollHeight - topHeight

    // let top = true;
    // let topHeight = 0;
    // let botHeight = 0;

    // for (let i = 0; i < buttons.length; i++)
    // {
    //   if (isVisible(buttons[i]))
    //   {
    //     top = false;

    //     // buttons[i].domElement.style.display = 'block';
    //   }
    //   else
    //   {
    //     // buttons[i].domElement.style.display = 'none';

    //     if (top)
    //     {
    //       topHeight += 90;
    //     }
    //     else
    //     {
    //       botHeight += 90;
    //     }
    //   }
    // }

    // console.log(domElement.scrollTop + ' -> ' + topHeight);
    // console.log((domElement.scrollHeight - domElement.scrollTop) + ' -> ' + botHeight);
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
  const length = (meta.length > buttons.length) ? meta.length : buttons.length;

  for (let i = 0; i < length; i++)
  {
    if (i >= meta.length)
    {
      // console.log('deactivate a button');

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