// TODO access to change placeholder value
// TODO onSearchKeyword register a specific keyword that if the user searched the event emits

import { domElement } from './page.js';

import Block from './block.js';

export { Block };

export {
  getIcon
} from './theme.js';

export { 
  onSearchInput
} from './registry.js';

/** add a block to the page
* @param { Block } block 
*/
export function appendBlock(block)
{
  domElement.appendChild(block.domElement);
}

/** remove a block to the page
* @param { Block } block 
*/
export function removeBlock(block)
{
  domElement.removeChild(block.domElement);
}
