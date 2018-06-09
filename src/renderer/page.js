import * as create from './create.js';

/** the page block
* @type { HTMLDivElement }
*/
export let domElement;

/** create and append page block
*/
export function load()
{
  domElement = create.div('page');
  document.body.appendChild(domElement);
}