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
let buttons = [];

/** the total of the buttons that has been initialized
*/
let total = 0;

/** the fixed height a button
*/
let height = 0;

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

/** @param { UIEvent } event 
*/
function onScroll(event)
{
  // TODO infinity scrolling

  if (buttons.length > 0)
  {
    console.log(buttons.length);
  }
  else
  {
    topHideout.style.visibility =  botHideout.style.visibility = 'hidden';
  }
}

/** list the required buttons on the page block using a reactive elements
* @param { ButtonMeta[] } meta 
*/
export function list(meta)
{
  // for (let i = 0; i < buttons.length; i++)
  // {
  //   domElement.removeChild(buttons[i].domElement);
  // }

  // buttons.length = 0;
  
  // console.log('================Start================');

  const length = (meta.length > buttons.length) ? meta.length : buttons.length;

  for (let i = 0; i < length; i++)
  {
    if (i >= meta.length)
    {
      // console.log('deactivate a button');

      // buttons[i].domElement.style.visibility = 'hidden';
    }
    else if (i < buttons.length)
    {
      // console.log('reactivate and update a button');

      // buttons[i].update(meta[i]);
      
      // buttons[i].domElement.style.visibility = 'visible';
    }
    else
    {
      // console.log('create a new button');
      
      const button = new Button(meta[i]);
      buttons.push(button);

      if (i === 0)
      {
        button.domElement.style.height = '10vh';
      }
      if (i === 1)
      {
        button.domElement.style.height = '15vh';
      }
      if (i === 2)
      {
        button.domElement.style.height = '5vh';
      }

      domElement.appendChild(button.domElement);
    }
  }
}