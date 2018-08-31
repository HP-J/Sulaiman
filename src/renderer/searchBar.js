import { on, emit } from './loader.js';

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

  on.focus(onfocus);
  on.blur(onblur);

  input.oninput = oninput;
}

/** gets called every time sulaiman regain focus
*/
function onfocus()
{
  // empty the search bar every time the sulaiman regain focus
  input.focus();
}

/** gets called every time sulaiman regain focus
*/
function onblur()
{
  // empty the search bar
  setInput('');
}

/** gets called when the user changes the input value
*/
function oninput()
{
  emit.input(input.value);
}

/** set the text in the search bar
* @param { string } text
*/
export function setInput(text)
{
  input.value = text;

  oninput();
}

/** set the text in the search bar (if the search bar is empty)
* @param { string } text
*/
export function setPlaceholder(text)
{
  input.placeholder = text;
}