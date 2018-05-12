import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export default function (path) 
{
  path = join(__dirname, path);

  if (!existsSync(path))
    throw 'file does not exist';

  let content = readFileSync(path).toString();

  // this.cacheable && this.cacheable();

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
          const name = split[0];
          let value = true;

          if (split && split[1]) 
          {
            value = split[1].replace(/['"]/g, '');
          }

          obj[name] = value;

          return obj;

        }, {});
    }
    
    content = match[2] || '';
  }

  content = content.replace(/\n/g, ' ').trim();
  // this.value = content;

  return 'module.exports = ' + JSON.stringify({ attributes: attrs, content: content });
}
// export const seperable = true;