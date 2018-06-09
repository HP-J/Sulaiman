import * as extension from '.';

export function init()
{
  // extension.onSearchBar(onSearchBar);

  // const block = new extension.Block();

  const block = document.createElement('div');

  // block.setAttribute('class', 'button');
  block.style.backgroundColor = 'red';


  document.body.appendChild(block);
  // extension.appendBlock(block);
}

function onSearchBar(text)
{
  // console.log('onSearchBar: ' + text);
}

// any code your write here on root gets executed every time sulaiman requires this module
// which is every time we want to execute a callback or a function, so if you want to execute a code only once
// put inside the start callback