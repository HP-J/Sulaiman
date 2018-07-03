import * as ext from 'sulaiman';

import { join } from 'path';
import { readdirSync } from 'fs';

export function start()
{
  // resolve to a full path
  const dir = join(__dirname, './styles/');

  // get all the style files in that directory
  const files = readdirSync(dir).filter((x) => { return x.endsWith('.css'); });

  for (let i = 0; i < files.length; i++)
  {
    ext.appendStyle(dir + files[i]);
  }
}