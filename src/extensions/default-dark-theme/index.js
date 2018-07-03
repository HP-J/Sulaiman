import * as ext from 'sulaiman';

import { join } from 'path';
import { readdirSync } from 'fs';

// TODO finish documenting and move it to a new repository

export function start()
{
  // resolve to a full path
  const dir = join(__dirname, './styles/');

  // get all the style files in that directory
  const files = readdirSync(dir).filter((x) => { return x.endsWith('.css'); });

  let length = 0;

  for (let i = 0; i < files.length; i++)
  {
    ext.appendStyle(dir + files[i], () =>
    {
      length += 1;

      if (files.length === length)
      {
        ext.hideSplashScreen();
      }
    });
  }
}