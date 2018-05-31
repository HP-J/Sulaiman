import * as extension from '.';

function init()
{
  extension.onSearchBar('onSearchBar');
}

function onSearchBar(text)
{
  console.log('got a onSearchBar callback with value: ' + text);
}

// any code your write here on root gets executed every time sulaiman requires this module
// which is every time we want to execute a callback or a function, so if you want to execute a code only once
// put inside a the start callback