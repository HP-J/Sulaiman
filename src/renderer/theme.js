import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

import postcss from 'postcss';
import url from 'postcss-url';

// TODO every ext has it own icons, themes come with no icons

// TODO I dont like using post-css, it feels avoidable

// TODO let the theme.js handle cloning icons

export const icons =
{
  browser: undefined,
  copy: undefined,
  exit: undefined,
  files: undefined,
  image: undefined,
  internet: undefined,
  more: undefined,
  next: undefined,
  open: undefined,
  phi: undefined,
  search: undefined,
  text: undefined,
  unknown: undefined,
  video: undefined,
  voice: undefined
};

export function load()
{
  const dir = join(__dirname, '../theme/dark');

  if (!existsSync(dir))
    throw 'theme does not exist';

  loadCSS(dir);
  loadIcons(dir);
}

/** @param { string } dir 
*/
function loadCSS(dir)
{
  dir = dir + '/style/';

  const files = readdirSync(dir);

  for (let i = 0; i < files.length; i++)
  {
    if (files[i].endsWith('.css'))
      document.head.appendChild(style(join(dir, files[i])));
  }
}

/** @param { string } dir 
*/
function loadIcons(dir)
{
  dir = dir + '/icons/';

  const files = readdirSync(dir);

  for (let i = 0; i < files.length; i++)
  {
    const name = files[i].split('.')[0];
    
    if (files[i].endsWith('.svg'))
      icons[name] = svg(join(dir, files[i]));
    else if (files[i].endsWith('.png'))
      icons[name] = image(join(dir, files[i]));
  }
}

/** reads the file and returns the text inside it
* @param { string } path 
*/
function textFile(path)
{
  return readFileSync(path).toString();
}

/** reads a svg file and returns an svg element with the right attributes
* @param { string } path 
*/
function svg(path)
{
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  const content = textFile(path);

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

/** returns a div element with background image url
*/
function image(path)
{
  const img = document.createElement('div');

  img.style.backgroundImage = 'url(' + path + ')';

  return img;
}

/** returns a style element after applying post-css
* @param { string } path 
*/
function style(path)
{
  const style = document.createElement('style');
  style.type = 'text/css';

  let styleString = textFile(path);

  const urlOptions =
  {
    // rebase change the path based on a new dir
    url: 'rebase'
  };

  const rebaseOptions =
  {
    // thr current css file path
    from: path,
    // the new parent is one dir up
    to: join(__dirname, '.')
  };

  // using postcss-url plugin to
  // rebase url()
  styleString = postcss().use(url(urlOptions)).process(styleString, rebaseOptions).css;

  style.appendChild(document.createTextNode(styleString));

  return style;
}
