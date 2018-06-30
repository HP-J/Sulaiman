import { div } from './theme.js';

/** the page block
* @type { HTMLDivElement }
*/
export let domElement;

/** create and append page block
*/
export function append()
{
  domElement = div('page');
  document.body.appendChild(domElement);
}