import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// TODO let extensions interchange themes on a button hover

/** when a new icon is loaded it gets cached in this 
* object so it can be cloned if requested again
* @type { Object.<string, HTMLElement> }
*/
const cachedIcons = {};

/** binds the style from a theme using async
* @param { string } dir the directory of the theme
* @param { () => void } callback
*/
export function appendStyles(dir, callback)
{
  // resolve to a full path
  dir = join(__dirname, '../themes/' + dir);

  // get all the style files in that directory
  const files = readdirSync(dir).filter(x => { return x.endsWith('.css'); });

  const length = files.length;
  let loaded = 0;

  // loop through them all
  for (let i = 0; i < length; i++)
  {
  // create a link element
    const style = document.createElement('link');

    style.rel = 'stylesheet';
    style.href = join(dir, files[i]);

    // the dom doesn't wait for invalid media types
    // but sill loads them async
    style.media = 'none';

    style.onload = function()
    {
    // fix the media type so the dom apply the stylesheet
      this.media = 'all';

      // if all files are loaded run the callback
      loaded += 1;

      if(loaded === length)
        callback();
    };

    document.head.appendChild(style);
  }
}

/** loads an icon and puts it into a div or svg element
*  based on its format and returns that element
* @param { string } path to the image
* (.png and .svg are the only formats supported)
* @returns { HTMLDivElement | SVGSVGElement } an element with the loaded icon
*/
export function getIcon(path)
{
  if (cachedIcons[path])
  {
    return cachedIcons[path].cloneNode(true);
  }
  else
  {
    let icon;

    if (!existsSync(path))
      throw 'icon (' + path + ') dose not exists';

    if (path.endsWith('.svg'))
      icon = svg(path);
    else if (path.endsWith('.png'))
      icon = image(path);

    cachedIcons[path] = icon;

    return icon;
  }
}

/** reads a svg file and returns an svg element with the right attributes
* @param { string } dir 
*/
function svg(dir)
{
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  const content = readFileSync(dir).toString();

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

    svg.innerHTML = match[2].replace(/\n/g, ' ').trim() || '';
  }

  return svg;
}

/** returns a div element with background image url
* @param { string } url
*/
function image(url)
{
  const img = document.createElement('div');

  img.style.backgroundImage = 'url(' + url + ')';

  return img;
}

/** returns an empty div block with the selected id
* @param { string } className
*/
export function div(className)
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
export function input(readOnly, className)
{
  const input = document.createElement('input');

  input.setAttribute('type', 'text');

  input.className = className;
  
  input.readOnly = readOnly;

  return input;
}