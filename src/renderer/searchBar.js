import { getDiv, getInput } from './theme';

import { emitCallbacks } from './registry.js';

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
export function append()
{
  // create and append search bar block
  domElement = getDiv('searchBar');
  document.body.appendChild(domElement);

  // create and append input and input placeholder
  placeholder = getInput(true, 'searchBarPlaceholder');
  input = getInput(false, 'searchBarInput');

  domElement.appendChild(placeholder);
  domElement.appendChild(input);

  // set the default placeholder value
  // value is infected by what is written in the input value
  // current is not infected by what is written in the input value
  // default the placeholder value when input value is empty
  placeholder.value = placeholder.current = placeholder.default = 'Search';

  // when the user change the input value callback updatePlaceholder()
  input.oninput = oninput;
}

/** focus the keyboard on search bar input
*/
export function focus()
{
  input.value = '';

  // setting input value manually doesn't call the event
  // then we also execute the callback manually
  oninput();

  // focus on the search bar so the user can start typing automatically
  input.focus();
}

/** an event callback, gets called when the user changes the input value
*/
function oninput()
{
  // emits the event to extensions
  emitCallbacks('onSearchInput', undefined, input.value);

  // update the search bar placeholder
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