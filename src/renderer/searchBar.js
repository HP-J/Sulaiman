import * as require from './require.js';

// import * as extension from '..';

/** @type { HTMLDivElement }
*/
export let domElement;

/** @type { HTMLInputElement }
*/
export let placeholder;

/** @type { HTMLInputElement }
*/
export let input;

/** create and append search bar block, input and input placeholder
*/
export function load()
{
  // create and append search bar block
  domElement = require.div('searchBar');
  document.body.appendChild(domElement);

  // create and append input and input placeholder
  placeholder = require.input(true, undefined, 'searchBarPlaceholder');
  input = require.input(false, undefined, 'searchBarInput');

  domElement.appendChild(placeholder);
  domElement.appendChild(input);

  // set the default placeholder value
  // value is infected by what is written in the input value
  // current is not infected by what is written in the input value
  // default the placeholder value when input value is empty
  placeholder.value = placeholder.current = placeholder.default = 'Search';

  // when the user change the input value callback updatePlaceholder()
  input.oninput = updatePlaceholder;
}

/** focus the keyboard on search bar input
*/
export function focus()
{
  input.value = '';

  updatePlaceholder();

  input.focus();
}

/** an event callback, gets called when the user changes the input value
*/
function updatePlaceholder()
{
  if (input.value.length > 0)
    placeholder.value = input.value + remove(placeholder.current, 0, input.value.length);
  else
    placeholder.value = placeholder.current = placeholder.default;
}

/** remove a piece of the string using indies
* @param { string } s 
* @param { number } startIndex 
* @param { number } endIndex 
*/
function remove(s, startIndex, endIndex)
{
  return s.substring(0, startIndex) + s.substring(endIndex);
}