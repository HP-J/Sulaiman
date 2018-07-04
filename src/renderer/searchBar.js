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
  domElement = document.createElement('div');
  domElement.setAttribute('class', 'searchBar');
  document.body.appendChild(domElement);
  
  // create and append placeholder and input blocks
  input = document.createElement('input');
  placeholder = document.createElement('div');
  
  input.setAttribute('class', 'searchBarInput');
  placeholder.setAttribute('class', 'searchBarPlaceholder');
  
  domElement.appendChild(placeholder);
  domElement.appendChild(input);
  
  // set the default placeholder value
  // value is infected by what is written in the input value
  // current is not infected by what is written in the input value
  // default the placeholder value when input value is empty
  placeholder.innerText = placeholder.current = placeholder.default = 'Search';

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
  if (input.value.length <= 0)
    setPlaceholder(placeholder.default);

  // merge the input and the placeholder values to create auto-complete
  placeholder.innerText = input.value + remove(placeholder.current, 0, input.value.length);
}

/** set the text in the search bar placeholder
* @param { string } value
*/
export function setPlaceholder(value)
{
  placeholder.current = value;
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