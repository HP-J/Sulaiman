import { readFileSync } from 'fs';

import postcss from 'postcss';
import url from 'postcss-url';

/** reads the file and returns the text inside it
* @param { string } path 
*/
function textFile(path)
{
  return readFileSync(path).toString();
}

// /** reads a svg file and returns an svg element with the right attributes
// * @param { string } path 
// */
// export function svg(path)
// {
//   const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

//   const content = textFile(path);

//   const match = content.match(/<svg([^>]+)+>([\s\S]+)<\/svg>/i);

//   let attrs = {};

//   if (match) 
//   {
//     attrs = match[1];
    
//     if (attrs) 
//     {
//       attrs = attrs.match(/([\w-:]+)(=)?("[^<>"]*"|'[^<>']*'|[\w-:]+)/g)
//         .reduce(function (obj, attr) 
//         {
//           const split = attr.split('=');

//           if (split && split[1]) 
//             svg.setAttribute(split[0], split[1].replace(/['"]/g, ''));

//         }, {});
//     }

//     svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

//     svg.innerHTML = match[2].replace(/\n/g, ' ').trim() || '';
//   }

//   return svg;
// }

/** returns a div element with background image url
*/
export function image(path)
{
  const img = document.createElement('div');

  img.style.backgroundImage = 'url(' + path + ')';

  return img;
}

/** returns a button element with the button class name
*/
export function button()
{
  const button = document.createElement('button');

  button.className = 'button';

  return button;
}

/** returns an empty div block with selected class name and id
* @param { string } className
* @param { string } id 
*/
export function block(className, id)
{
  const div = document.createElement('div');
  
  if (className !== undefined)
    div.className = className;

  if (id !== undefined)
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

/** returns a style element after applying post-css
* @param { string } path 
*/
export function style(path)
{
  const style = document.createElement('style');
  style.type = 'text/css';

  let styleString = textFile(path);

  const options =
  {
    url: 'rebase'
  };

  // using postcss-url plugin to
  // rebase url()
  styleString = postcss().use(url(options)).process(styleString, { from: path, to: __filename }).css;

  style.appendChild(document.createTextNode(styleString));

  return style;
}