import * as require from './require.js';

import { Button, ButtonMeta } from './button.js';

/** @type { HTMLDivElement }
*/
export let domElement;

/** an array of the buttons that has been initialized
* @type { Button[] }
*/
let buttons = [];

/** the total of the buttons that has been initialized
*/
const total = 0;

export function load()
{
  domElement = require.block(undefined, 'page');
  document.body.appendChild(domElement);

  domElement.onscroll = onScroll;
}

/** @param { UIEvent } event 
*/
function onScroll(event)
{

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
  
  console.log('================Start================');

  for (let i = 0; i < meta.length; i++)
  {
    // let button;

    if (i < buttons.length)
    {
      console.log('update an old button');
    }
    else
    {
      console.log('create a new button');
    }

    // if (i < buttons.length)
    // {
    //   buttons[i].update(meta[i]);
    // }
    // else
    // {

    // const button = new Button(meta[i]);

    // button.domElement.style.visibility = 'hidden';
      
    // buttons.push(button);

    // domElement.appendChild(button.domElement);
    // }
  }
}