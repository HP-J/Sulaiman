import { emitCallbacks } from './registry.js';

/** @type { HTMLInputElement }
*/
export let placeholder;

/** @type { HTMLInputElement }
*/
export let searchBar;

/** create and append search bar block, input and input placeholder
*/
export function append()
{
  // create and append placeholder and input blocks
  searchBar = document.createElement('input');
  placeholder = document.createElement('div');
  
  searchBar.setAttribute('class', 'searchBar');
  placeholder.setAttribute('class', 'searchBarPlaceholder');
  
  document.body.appendChild(searchBar);
  document.body.appendChild(placeholder);

  // add new properties to placeholder
  placeholder['default'] = '';
  placeholder['current'] = '';

  searchBar.onfocus = searchBarOnFocus;
  searchBar.onblur = searchBarOnBlur;
  
  searchBar.oninput = oninput;
}

/** gets called every time sulaiman regain focus
*/
export function onfocus()
{
  // empty the search bar
  searchBar.value = '';

  // setting input value manually doesn't call the event
  // then we also execute the callback manually
  oninput();

  // empty the search bar every time the sulaiman regain focus
  searchBar.focus();
}

/** gets called every time the search bar regain focus
*/
function searchBarOnFocus()
{
  placeholder.classList.add('searchBarPlaceholder-focus');
  
  // if the placeholder was hidden
  // make it reappear
  placeholder.style.visibility = 'visible';
}

/** gets called every time the search bar loses focus
*/
function searchBarOnBlur()
{
  placeholder.classList.remove('searchBarPlaceholder-focus');

  // if the search bar is out of focus and is not empty
  // hide the placeholder
  if (searchBar.value.length > 0)
    placeholder.style.visibility = 'hidden';
}

/** gets called when the user changes the input value
*/
function oninput()
{
  // remove any old placeholder text since they
  // are no longer relevant if the text changes
  setPlaceholder('');

  // emits the event to extensions
  emitCallbacks('onSearchBarInput', undefined, searchBar.value);
}

/** set the text in the search bar's placeholder
* @param { string } text
*/
export function setPlaceholder(text)
{
  placeholder.current = text;

  updatePlaceholder();
}

/** set the text in the search bar's placeholder if the search bar is empty
* @param { string } text
*/
export function setDefaultPlaceholder(text)
{
  placeholder.default = text;

  updatePlaceholder();
}

function updatePlaceholder()
{
  if (searchBar.value.length > 0)
    // merge the input and the placeholder values to create a auto-completed sentence
    placeholder.innerText = searchBar.value + placeholder.current.substring(searchBar.value.length);
  else
    // update the search bar placeholder to the default
    placeholder.innerText = placeholder.default;
}