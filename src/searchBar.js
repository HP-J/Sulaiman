import * as require from './require.js';

/** @type { HTMLDivElement }
*/
export let domElement;

/** @type { HTMLInputElement }
*/
export let placeholder;

/** @type { HTMLInputElement }
*/
export let input;

export function load()
{
  domElement = require.block('searchBar');
  document.body.appendChild(domElement);

  // create the elements dom
  placeholder = require.input('searchBarPlaceholder');
  input = require.input('searchBarInput', '', false);

  // append the bar to dom
  domElement.appendChild(placeholder);
  domElement.appendChild(input);

  // return the default placeholder value, when the input value is empty
  placeholder.value = placeholder.current = placeholder.default = 'Search';

  // when the user change the text in search bar call updatePlaceholder()
  input.oninput = updatePlaceholder;
}

/** update the placeholder when the user writes into input
*/
function updatePlaceholder()
{
  if (placeholder.value.length > 0)
    placeholder.value = input.value + remove(placeholder.current, 0, input.value.length);
  else
    placeholder.value = placeholder.current = placeholder.default;
}

/** remove a piece of a string using indies
* @param { string } s 
* @param { number } startIndex 
* @param { number } endIndex 
*/
function remove(s, startIndex, endIndex)
{
  return s.substring(0, startIndex) + s.substring(endIndex);
}