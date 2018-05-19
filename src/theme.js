import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

import * as require from './require.js';

export const visuals =
{
  browser: undefined,
  copy: undefined,
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
function loadVisuals(dir)
{
  dir = dir + '/visuals/';

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
