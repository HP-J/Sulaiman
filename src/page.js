import * as require from './require.js';

import { Button, ButtonMeta } from './button.js';

/** @type { HTMLDivElement }
*/
export let domElement;

/** an array of the buttons that has been initialized
* @type { Button[] }
*/
const buttons = [];

/** the total of the buttons that has been initialized
*/
let total = 0;

export function load()
{
  domElement = require.block('page');
  document.body.appendChild(domElement);
}

/** list the required buttons on the page block using a reactive elements
* @param { ButtonMeta[] } meta 
*/
export function list(meta)
{
  while (domElement.firstChild)
  {
    domElement.removeChild(domElement.firstChild);
  }

  for (let i = 0; i < meta.length; i++)
  {
    let button;

    // if (i < buttons.length)
    // {
    //   buttons[i].update(meta[i]);
    // }
    // else
    // {
      button = new Button(meta[i]);
      buttons.push(button);

      // domElement.remov

      domElement.appendChild(button.domElement);
    // }
  }
}