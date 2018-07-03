/** returns an empty div block with the selected id
* @param { string } className
*/
export function getDiv(className)
{
  const div = document.createElement('div');

  div.className = className;

  return div;
}

/** returns an input element with with
* selected class name, id and settings
* @param { string } readOnly
* @param { string } className
*/
export function getInput(readOnly, className)
{
  const input = document.createElement('input');

  input.setAttribute('type', 'text');

  input.className = className;

  input.readOnly = readOnly;

  return input;
}