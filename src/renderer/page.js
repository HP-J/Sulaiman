import { getDiv } from './util.js';

/** the page block
* @type { HTMLDivElement }
*/
export let domElement;

/** create and append page block
*/
export function append()
{
  domElement = getDiv('page');
  document.body.appendChild(domElement);
}