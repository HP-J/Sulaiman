import * as require from './require.js';

import { visuals } from './theme.js';
import { ButtonMeta } from './button.js';
import * as page from './page.js';

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
  domElement = require.block(undefined, 'searchBar');
  document.body.appendChild(domElement);

  // create the elements dom
  placeholder = require.input(true, undefined, 'searchBarPlaceholder');
  input = require.input(false, undefined, 'searchBarInput');

  // append the bar to dom
  domElement.appendChild(placeholder);
  domElement.appendChild(input);

  // return the default placeholder value, when the input value is empty
  placeholder.value = placeholder.current = placeholder.default = 'Search';

  // when the user change the text in search bar call updatePlaceholder()
  input.oninput = updatePlaceholder;

  // input.value = 'Hello';
}

export function focus()
{
  input.value = '';

  updatePlaceholder();

  input.focus();
}

/** update the placeholder when the user writes into input
*/
function updatePlaceholder()
{
  const meta = [];

  for (let i = 0; i < input.value.length; i++)
  {
    meta.push(new ButtonMeta(input.value.charAt(i), i, visuals.next, visuals.next));
  }

  page.list(meta);

  // placeholder.current = input.value + ' = ' + input.value.length;

  if (input.value.length > 0)
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