// TODO access to change placeholder (every button when selected can change placeholder value) (what about auto-complete)
// TODO access to allocate block from page (how to clean a block childs)

import { registerCallback } from './registry.js';

/** executes every time the user writes something into the search bar
* @param { string } callbackName the callback function's name
*/
export function onSearchBar(callbackName)
{
  registerCallback('onSearchBar', callbackName);
}