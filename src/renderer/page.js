/** the page block
* @type { HTMLDivElement }
*/
export let domElement;

/** create and append page block
*/
export function append()
{
  domElement = document.createElement('div');
  domElement.setAttribute('class', 'page');
  document.body.appendChild(domElement);
}