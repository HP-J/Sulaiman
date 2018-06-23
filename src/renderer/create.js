/** returns an empty div block with the selected id
* @param { string } id
*/
export function div(id)
{
  const div = document.createElement('div');

  div.id = id;

  return div;
}

/** returns an input element with with
* selected class name, id and settings
* @param { string } readOnly 
* @param { string } className 
* @param { string } id 
*/
export function input(readOnly, className, id)
{
  const input = document.createElement('input');

  input.setAttribute('type', 'text');

  if (id !== undefined)
    input.id = id;

  if (className !== undefined)
    input.className = className;
  
  input.readOnly = readOnly;

  return input;
}