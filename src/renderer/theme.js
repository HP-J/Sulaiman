import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// TODO let extensions load icons using a path
// TODO let extensions interchange themes on a button hover

/** reads the file and returns the text inside it
* @param { string } path 
*/
function textFile(path)
{
  return readFileSync(path).toString();
}

/** loads the style files of a theme async
* @param { string } themeName
* @param { () => any } callback
*/
export function loadStyles(themeName, callback)
{
  const dir = join(__dirname, '../themes/' + themeName + '/styles');

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

// /** @param { string } dir 
// */
// function loadIcons(dir)
// {
//   dir = dir + '/icons/';

//   const files = readdirSync(dir);

//   for (let i = 0; i < files.length; i++)
//   {
//     const name = files[i].split('.')[0];
    
//     if (files[i].endsWith('.svg'))
//       icons[name] = svg(join(dir, files[i]));
//     else if (files[i].endsWith('.png'))
//       icons[name] = image(join(dir, files[i]));
//   }
// }

// /** reads a svg file and returns an svg element with the right attributes
// * @param { string } path 
// */
// function svg(path)
// {
//   const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

//   const content = textFile(path);

//   const match = content.match(/<svg([^>]+)+>([\s\S]+)<\/svg>/i);

//   let attrs = {};

//   if (match) 
//   {
//     attrs = match[1];
    
//     if (attrs) 
//     {
//       attrs = attrs.match(/([\w-:]+)(=)?("[^<>"]*"|'[^<>']*'|[\w-:]+)/g)
//         .reduce(function (obj, attr) 
//         {
//           const split = attr.split('=');

//           if (split && split[1]) 
//             svg.setAttribute(split[0], split[1].replace(/['"]/g, ''));

//         }, {});
//     }

//     svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

//     svg.innerHTML = match[2].replace(/\n/g, ' ').trim() || '';
//   }

//   return svg;
// }

// /** returns a div element with background image url
// */
// function image(path)
// {
//   const img = document.createElement('div');

//   img.style.backgroundImage = 'url(' + path + ')';

//   return img;
// }
