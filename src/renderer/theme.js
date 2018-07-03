import { readdirSync } from 'fs';
import { join } from 'path';

/** binds the style files from a theme [async]
* @param { string } dir the directory of the theme
* @param { () => void } callback
*/
export function appendTheme(dir, callback)
{
  // resolve to a full path
  dir = join(__dirname, '../themes/' + dir);

  // get all the style files in that directory
  const files = readdirSync(dir).filter(x => { return x.endsWith('.css'); });

  const length = files.length;
  let loaded = 0;

  // loop through them all
  for (let i = 0; i < length; i++)
  {
    // create a link element
    const style = document.createElement('link');

    style.rel = 'stylesheet';
    style.href = join(dir, files[i]);

    // the dom doesn't wait for invalid media types
    // but sill loads them async
    style.media = 'none';

    style.onload = function()
    {
    // fix the media type so the dom apply the stylesheet
      this.media = 'all';

      // if all files are loaded run the callback
      loaded += 1;

      if(loaded === length)
        callback();
    };

    document.head.appendChild(style);
  }
}

/** returns an empty div block with the selected id
* @param { string } className
*/
export function getDiv(className)
{
  const div = document.createElement('div');

  div.className = className;

  return div;
}

/** returns an input element with with
* selected class name, id and settings
* @param { string } readOnly
* @param { string } className
*/
export function getInput(readOnly, className)
{
  const input = document.createElement('input');

  input.setAttribute('type', 'text');

  input.className = className;

  input.readOnly = readOnly;

  return input;
}