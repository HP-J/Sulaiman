import * as ext from 'sulaiman';

import { join } from 'path';

// TODO finish documenting and move it to a new repository

// the current behavior doesn't allow you to store variables
// everything you do gets deleted when your code stops running

// any code your write on root gets executed every time sulaiman requires this module
// which is every time we want to execute an event callback
// if you want to execute a code only once put it inside the start callback

// TODO test if local modules are hosted outside the proxies
// if the user creates a new script file and required that script
// will it escape the host or not

export function start()
{
  const block = new ext.Block();
  
  block.itsButton('hello', 'world', ext.getIcon(join(__dirname, './icons/search.svg')), ext.getIcon(join(__dirname, './icons/expand.svg')));
  
  // block.style.backgroundColor = 'red';

  ext.appendBlock(block);

  // ext.appendStyle(join(__dirname, './page-alt.css'));
  // ext.removeStyle(join(__dirname, './page-alt.css'));

  // ext.clipboard.writeText('hello world');

  // assigning functions directly (ex: arrow funcs) is not allowed in the sandbox
  // the function needs to exists on the root of the script
  // ext.onSearchInput(onSearchInput);
  // block.events.onclick = onclick;
}

/**
* @param { MouseEvent } ev
*/
function onclick(ev)
{
  console.log(this);
}

function onSearchInput(text)
{
  if (text === 'g')
    ext.setPlaceholder('google');
  if (text === 'ga')
    ext.setPlaceholder('gamely');

  console.log('onSearchInput: ' + text);
}