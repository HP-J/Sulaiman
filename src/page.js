import * as require from './require.js';

/** @type { HTMLDivElement }
*/
export let domElement;

export function load()
{
  domElement = require.block('page');
  document.body.appendChild(domElement);
}