import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

import * as require from './require.js';

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

const themeDir = '../theme/';

/** @param { string } themeName 
*/
export function load(themeName)
{
  const dir = join(__dirname, themeDir + themeName);

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
      document.head.appendChild(require.style(join(dir, files[i])));
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
      icons[name] = require.svg(join(dir, files[i]));
    else if (files[i].endsWith('.png'))
      icons[name] = require.image(join(dir, files[i]));
  }
}
