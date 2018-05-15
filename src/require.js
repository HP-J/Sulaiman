import { readFileSync } from 'fs';

/** @param { string } path 
*/
export function svg(path) 
{
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  const content = readFileSync(path).toString();

  const match = content.match(/<svg([^>]+)+>([\s\S]+)<\/svg>/i);

  let attrs = {};

  if (match) 
  {
    attrs = match[1];
    
    if (attrs) 
    {
      attrs = attrs.match(/([\w-:]+)(=)?("[^<>"]*"|'[^<>']*'|[\w-:]+)/g)
        .reduce(function (obj, attr) 
        {
          const split = attr.split('=');

          if (split && split[1]) 
            svg.setAttribute(split[0], split[1].replace(/['"]/g, ''));

        }, {});
    }

    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    svg.innerHTML = match[2].replace(/\n/g, ' ').trim() || '';
  }

  return svg;
}

export function button()
{
  const button = document.createElement('button');

  button.className = 'button';

  return button;
}

/** @param { string } id
*/
export function block(id)
{
  const div = document.createElement('div');
  
  div.id = id;

  return div;
}

/** @param { string } id 
* @param { string } className 
* @param { string } readOnly 
*/
export function input(id, className, readOnly)
{
  const input = document.createElement('input');

  input.setAttribute('type', 'text');

  input.id = id || '';
  input.className = className || '';
  input.readOnly = (readOnly === undefined) ? true : false;

  return input;
}

/** @param { string } path 
*/
export function css(path)
{
  const css = document.createElement('link');
  css.type = 'text/css';
  css.rel = 'stylesheet';
  css.href = path;

  return css;
}