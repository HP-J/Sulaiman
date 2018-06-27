import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// TODO let extensions interchange themes on a button hover

/** when a new icon is loaded it gets cached in this 
* object so it can be cloned if requested again
* @type { Object.<string, HTMLElement> }
*/
const cachedIcons = {};

/** binds the style from a theme using async
* @param { string } themeDirName the directory of the theme
* @param { () => any } callback
*/
export function bindStyles(themeDirName, callback)
{
  const dir = join(__dirname, '../themes/' + themeDirName);

  // check if the theme exists
  if (existsSync(dir))
  {
    // get all the files in that directory
    const files = readdirSync(dir);

    // loop through them all
    for (let i = 0; i < files.length; i++)
    {
      // if the file is a stylesheet
      if (files[i].endsWith('.css'))
      {
        // create a link element
        const style = document.createElement('link');
  
        style.rel = 'stylesheet';
        style.href = join(dir, files[i]);

        // the dom doesn't wait for invalid media types
        // but sill loads them async
        style.media = 'none';
  
        // if this is the last stylesheet in the lpp[]
        style.last = (i === files.length - 1);
  
        style.onload = () =>
        {
          // fix the media type so the dom apply the stylesheet
          style.media = 'all';
  
          // if this is the last stylesheet execute the callback
          if (style.last)
            callback();
        };
      
        document.head.appendChild(style);
      }
    }
  }
  // if not fail silently
  else
  {
    callback();
  }
}

/** loads an icon and puts it into a div or svg element
*  based on its format and returns that element
* @param { string } dir direction to the image
* (.png and .svg are the only formats supported)
* @returns { HTMLDivElement | SVGSVGElement } an element with the loaded icon
*/
export function getIcon(dir)
{
  if (cachedIcons[dir])
  {
    return cachedIcons[dir].cloneNode(true);
  }
  else
  {
    let icon;

    if (!existsSync(dir))
      throw 'icon (' + dir + ') dose not exists';

    if (dir.endsWith('.svg'))
      icon = svg(dir);
    else if (dir.endsWith('.png'))
      icon = image(dir);

    cachedIcons[dir] = icon;

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
