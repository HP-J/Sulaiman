import * as require from './require.js';

import { Button, ButtonMeta } from './button.js';

/** the top block of infinity fills out for
* the hidden contact so the scroll height stays the same
* @type { HTMLDivElement }
*/
let topInfinity;

/** the bottom block of infinity fills out for 
* the hidden contact so the scroll height stays the same
* @type { HTMLDivElement }
*/
let botInfinity;

/** the page block
* @type { HTMLDivElement }
*/
export let domElement;

/** the grid block
* @type { HTMLDivElement }
*/
export let grid;

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

  grid = require.block(undefined, 'grid');
  domElement.appendChild(grid);

  topInfinity = require.block('topInfinity');
  domElement.appendChild(topInfinity);

  // botInfinity = require.block('botInfinity');
  // domElement.appendChild(botInfinity);

  // botInfinity = require.block('botInfinity');
  // domElement.appendChild(botInfinity);
  
  // domElement.onscroll = onScroll;
    
  // init top and bottom hideouts
  // onScroll();
}

/** is a button visible on the page's viewport, Infinity Scrolling
* @param { Button } button 
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

/** hide a button from list, infinity scrolling
* @param { Button } button 
*/
function hide(button)
{
  // const top = domElement.scrollTop;
  
  button.domElement.rect = button.domElement.getBoundingClientRect();
  button.domElement.cache = button.domElement.getBoundingClientRect;

  button.domElement.getBoundingClientRect = () => { return this.rect; };

  button.domElement.style.display = 'none';

  // domElement.scrollTop = top;
}

/** show a button in list, infinity scrolling
* @param { Button } button 
*/
function show(button)
{
  // const top = domElement.scrollTop;

  button.domElement.getBoundingClientRect = button.domElement.cache;
  
  button.domElement.rect = button.domElement.cache = null;

  button.domElement.style.display = 'block';

  // domElement.scrollTop = top;
}

/** infinity scrolling update callback
* @param { UIEvent } event 
*/
export function onScroll()
{
  // const height = domElement.getBoundingClientRect().height;
  
  // domElement.scrollTop = 210;

  // const rect = domElement.getBoundingClientRect();

  topInfinity.style.height = grid.scrollHeight + 'px';
  // console.log(grid.scrollHeight);

  // botInfinity.style.bottom =  (domElement.getBoundingClientRect().height - domElement.scrollHeight) + 'px';
  // botInfinity.style.height =  ((domElement.scrollHeight - height) -  domElement.scrollTop) + 'px';

  // topInfinity.style.height =  domElement.scrollTop + 'px';

  // hide(buttons[0]);
  // domElement.scrollTop = 210;
  // hide(buttons[1]);
  // console.log(isVisible(buttons[2]));

  // console.log(rect.top + domElement.scrollTop);
  // console.log(domElement.scrollHeight || rect.height);

  // if (buttons.length > 0)
  {
    // console.log('0 is ' + isVisible(buttons[0]) + ' and 14 is ' + isVisible(buttons[10]));

    // for (let i = 0; i < buttons.length; i++)
    {
      // if (isVisible(buttons[i]))
      {
        // buttons[i].domElement.style.display = 'block';
        // show(buttons[i]);
      }
      // else
      {
        // buttons[i].domElement.style.display = 'none';
        // hide(buttons[i]);
      }
    }
  }
  // else
  {
    // topHideout.style.display =  botHideout.style.display = 'none';
    // topHideout.style.width =  botHideout.style.width = 'none';
  }

  // console.log(domElement.scrollTop);
  // console.log(domElement.scrollHeight);
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

      grid.appendChild(button.domElement);
    }
  }
}