import * as ext from 'sulaiman';
// import * as ext from '/mnt/K/.Projects/sulaiman/src/renderer/extension.js';

import { join } from 'path';

// the current behavior doesn't allow you to store variables
// everything you do gets deleted when your code stops running
// TODO since we don't keep extensions in memory
// extension.saveObject()
// extension.loadObject()

// any code your write on root gets executed every time sulaiman requires this module
// which is every time we want to execute an event callback
// if you want to execute a code only once put it inside the start callback

// TODO test if local modules are hosted outside the proxies
// if the user creates a new script file and required that script
// will it escape the host or not

// TODO assign functions to global objects then 
// calling them in a element callback is a way to escape the sandbox  

export function start()
{
  // ext.onSearchInput(onSearchInput);

  const block = new ext.Block();

  block.itsButton('hello', 'world', ext.getIcon(join(__dirname, './icons/search.svg')), ext.getIcon(join(__dirname, './icons/phi.svg')));

  // block.style.backgroundColor = 'red';

  ext.appendBlock(block);
}

/**
* @param { MouseEvent } ev
*/
function onclick(ev)
{
  console.log(ev !== undefined);
}

function onSearchInput(text)
{
  // console.log('onSearchInput: ' + text);
}