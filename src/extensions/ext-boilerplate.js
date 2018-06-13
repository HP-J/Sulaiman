import * as extension from '.';

export function init()
{
  // extension.onSearchBar(onSearchBar);

  const block = new extension.Block();
  
  block.setClass('button');

  block.style.backgroundColor = 'red';

  extension.appendBlock(block);
}

function onSearchBar(text)
{
  // console.log('onSearchBar: ' + text);
}

// any code your write here on root gets executed every time sulaiman requires this module
// which is every time we want to execute a callback or a function, so if you want to execute a code only once
// put inside the start callback