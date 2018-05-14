import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export default function (path) 
{
  path = join(__dirname, path);

  if (!existsSync(path))
    throw 'file does not exist';

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