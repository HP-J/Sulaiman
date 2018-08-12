import { emitCallbacks } from './registry.js';
import { onFocus, onBlur } from './extension.js';

/** @type { HTMLInputElement }
*/
export let input;

/** create and append the search bar and card-space
*/
export function append()
{
  input = document.createElement('input');
  input.setAttribute('id', 'searchBar');
  document.body.appendChild(input);

  onFocus(sulaimanOnFocus);
  onBlur(sulaimanOnBlur);

  input.oninput = oninput;
}

/** gets called every time sulaiman regain focus
*/
function sulaimanOnFocus()
{
  // empty the search bar every time the sulaiman regain focus
  input.focus();
}

/** gets called every time sulaiman regain focus
*/
function sulaimanOnBlur()
{
  // empty the search bar
  input.value = '';

  // setting input value manually doesn't call the event
  oninput();
}

/** gets called when the user changes the input value
*/
function oninput()
{
  emitCallbacks('onSearchBarInput', input.value);
}

/** set the text in the search bar (if the search bar is empty)
* @param { string } text
*/
export function setPlaceholder(text)
{
  input.placeholder = text;
}