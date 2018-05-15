import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

import * as require from './require.js';

/** @type {{ browser: SVGAElement, clipboard: SVGAElement, exit: SVGAElement, files: SVGAElement, more: SVGAElement, next: SVGAElement, search: SVGAElement, voice: SVGAElement }}
*/
export const visuals =
{
  browser: undefined,
  clipboard: undefined,
  exit: undefined,
  files: undefined,
  more: undefined,
  next: undefined,
  search: undefined,
  voice: undefined
};

const themeDir = '../theme/';

/** @param { string } themeName 
*/
export function load(themeName)
{
  const dir = join(__dirname, themeDir + themeName);

  if (!existsSync(dir))
    throw 'theme does not exist';

  loadCSS(dir);
  loadVisuals(dir);
}

/** @param { string } dir 
*/
function loadCSS(dir)
{
  // css files are located in a directory named style
  dir = dir + '/style/';

  const head = document.getElementsByTagName('head')[0];

  if (!existsSync(dir))
    throw 'css theme does not exist';

  const files = readdirSync(dir);

  for (let i = 0; i < files.length; i++)
  {
    if (files[i].endsWith('.css'))
      head.appendChild(require.css(join(dir, files[i])));
  }
}

/** @param { string } dir 
*/
function loadVisuals(dir)
{
  dir = dir + '/visuals/';

  if (!existsSync(dir))
    throw 'visuals theme does not exist';

  const files = readdirSync(dir);

  for (let i = 0; i < files.length; i++)
  {
    if (files[i].endsWith('.svg'))
    {
      const name = files[i].split('.')[0];

      visuals[name] = require.svg(join(dir, files[i]));
    }
  }
}
