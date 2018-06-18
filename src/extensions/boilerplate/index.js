import * as extension from 'sulaiman';

// the current behavior doesn't allow you to store variables
// everything you do gets deleted when your code stops running
// TODO since we don't keep extensions in memory
// extension.saveObject()
// extension.loadObject()

// any code your write on root gets executed every time sulaiman requires this module
// which is every time we want to execute an event callback
// if you want to execute a code only once put it inside the start callback

// TODO test if local modules are hosted outside the proxies

// TODO assign functions to global objects then 
// calling them in a element callback is a way to escape the sandbox  

export function start()
{
  // extension.onSearchBar(onSearchBar);

  const block = new extension.Block();

  block.itsButton('hello', 'world', undefined, undefined);

  extension.appendBlock(block);
}

function onSearchBar(text)
{
  // console.log('onSearchBar: ' + text);
}