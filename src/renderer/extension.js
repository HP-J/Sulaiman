// TODO access to change placeholder value

import { domElement } from './page.js';

import Block from './block.js';

export {
  Block
};

export { 
  onSearchBar
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
  // domElement.removeChild(block.domElement);
}
