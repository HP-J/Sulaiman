import * as require from './require.js';

import { Button } from './button.js';

// TODO let the page handle html elements
// instead of just the Button class

/** the page block
* @type { HTMLDivElement }
*/
export let domElement;

/** the max number of buttons that can be created 
*/
const maxButtons = 200;

/** an array of the buttons that has been initialized
* @type { Button[] }
*/
const buttons = [];

/** create and append page block and infinity scrolling top and bottom blocks
*/
export function load()
{
  domElement = require.block(undefined, 'page');
  document.body.appendChild(domElement);
}

/** list the required buttons on the page block using a reactive elements
* @param { ButtonMeta[] } meta 
*/
export function list(meta)
{
  let length = (meta.length > buttons.length) ? meta.length : buttons.length;

  if (length > maxButtons)
    length = maxButtons;

  for (let i = 0; i < length; i++)
  {
    // deactivate a button
    if (i >= meta.length)
    {
      buttons[i].domElement.style.display = 'none';
    }
    // reactivate and update a button
    else if (i < buttons.length)
    {
      buttons[i].update(meta[i]);
      
      buttons[i].domElement.style.display = 'block';
    }
    // create a new button
    else
    {
      const button = new Button(meta[i]);
      buttons.push(button);

      domElement.appendChild(button.domElement);
    }
  }
}