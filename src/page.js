import * as require from './require.js';

import { Button, ButtonMeta } from './button.js';

/** the page block
* @type { HTMLDivElement }
*/
export let domElement;

/** the grid block
* @type { HTMLDivElement }
*/
export let grid;

/** the block of infinity that fills out for
* the grid scroll height but inside of the page block
* @type { HTMLDivElement }
*/
let infinity;

/**
*/
let scrollOffset = 0;

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

  infinity = require.block('infinity');
  domElement.appendChild(infinity);

  grid = require.block(undefined, 'grid');
  domElement.appendChild(grid);

  domElement.onscroll = onScroll;
  
  // onScroll();
}

/** is a button visible on the page's viewport, Infinity Scrolling
* @param { Button } button 
*/
function isVisible(button)
{
  const gridRect = grid.getBoundingClientRect();
  const buttonRect = button.rect;

  const gridMinY = Math.round(gridRect.top);
  const gridMaxY = Math.round(gridRect.height);
  const buttonMinY = Math.round(buttonRect.top - domElement.scrollTop) - gridMinY;
  const buttonMaxY = (Math.round(buttonRect.top - domElement.scrollTop) - gridMinY) + Math.round(buttonRect.height);

  return (buttonMinY < gridMaxY) && (buttonMaxY >= 0);
}

/** show a button in list, infinity scrolling
* @param { Button } button 
*/
function show(button)
{
  if (!button.hidden)
    return;
    
  button.hidden = false;

  button.domElement.style.display = 'block';

  scrollOffset -= button.scrollOffset;

  grid.scrollTop = domElement.scrollTop - scrollOffset;
    
  button.scrollOffset = 0;
}

/** hide a button from list, infinity scrolling
* @param { Button } button 
*/
function hide(button)
{
  if (button.hidden)
    return;
    
  button.hidden = true;

  button.domElement.style.display = 'none';

  button.scrollOffset = (domElement.scrollTop - grid.scrollTop) - scrollOffset;
    
  scrollOffset += button.scrollOffset;

  grid.scrollTop = domElement.scrollTop - scrollOffset;
}

/** infinity scrolling update callback
* @param { UIEvent } event 
*/
export function onScroll()
{
  grid.style.top = domElement.scrollTop + 'px';
  grid.scrollTop = domElement.scrollTop - scrollOffset;

  // if (buttons.length > 0)
  {
    for (let i = 0; i < buttons.length; i++)
    {
      if (isVisible(buttons[i]))
        show(buttons[i]);
      else
        hide(buttons[i]);
    }
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

      button.scrollOffset = 0;

      grid.appendChild(button.domElement);

      button.rect = button.domElement.getBoundingClientRect();
    }
  }

  infinity.style.height = (grid.scrollHeight || domElement.getBoundingClientRect().height) + 'px';
}