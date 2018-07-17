import { existsSync, readFileSync, readdirSync } from 'fs';

import { join } from 'path';

import { splash } from './renderer.js';

import { registerCallback } from './registry.js';

import Block from './block.js';

export { Block };

export { setPlaceholder } from './searchBar.js';

/** [needs a registry permission]
* access to read & write to clipboard
* @type { Electron.clipboard }
*/
export const clipboard = undefined;

/** when a new icon is loaded it gets cached in this
* object so it can be cloned if requested again
* @type { Object.<string, HTMLElement> }
*/
const cachedIcons = {};

/** @type { Object.<string, HTMLElement[]> }
*/
const appendedStyles = {};

/** loads an icon and puts it into a div or svg element
*  based on its format and returns that element
* @param { string } path to the image
* (.png and .svg are the only formats supported)
* @param { string } [className] [optional] add a class to the icon's element
* @returns { HTMLDivElement | SVGSVGElement } an element with the loaded icon
*/
export function getIcon(path, className)
{
  // if the icon is cached
  if (cachedIcons[path])
  {
    // return a clone of it
    return cachedIcons[path].cloneNode(true);
  }
  else
  {
    let icon;

    // icon dose not exists
    if (!existsSync(path))
      throw 'icon (' + path + ') dose not exists';

    if (path.endsWith('.svg'))
      icon = svg(path);
    else if (path.endsWith('.png'))
      icon = image(path);

    icon.setAttribute('class', className);

    // cache the icon for later use
    cachedIcons[path] = icon;

    // return the icon in an html element
    return icon;
  }
}

/** reads a svg file and returns an svg element with the right attributes
* @param { string } path
*/
function svg(path)
{
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
        .reduce((obj, attr) =>
        {
          const split = attr.split('=');

          if (split && split[1])
            svg.setAttribute(split[0], split[1].replace(/['"]/g, ''));

        }, {});
    }

    svg.innerHTML = match[2].replace(/\n/g, ' ').trim() || '';
  }

  return svg;
}

/** returns a div element with background image url
* @param { string } path
*/
function image(path)
{
  const img = document.createElement('div');

  img.style.backgroundImage = 'url(' + path + ')';

  return img;
}

/** append a stylesheet files to the DOM [async]
* @param { () => void } callback gets called when all the styles are loaded
* @param { string[] } files paths to the stylesheets (css) files to want to append to DOM
*/
export function appendStyle(callback, ...files)
{
  let length = 0;

  for (let i = 0; i < files.length; i++)
  {
    const path = files[i];

    if (appendedStyles[path] !== undefined)
      throw 'this stylesheet file is already loaded to DOM';

    // create a link element
    const style = document.createElement('link');

    style.rel = 'stylesheet';
    style.href = path;

    // remember the loaded styles
    appendedStyles[path] = style;

    // gets called when a style file is loaded
    style.onload = () =>
    {
      length += 1;

      // if all the files are loaded run the callback
      if (files.length === length)
        callback();
    };

    // append the style to the DOM
    document.head.appendChild(style);
  }
}

/** append all the stylesheet files from a directory to the DOM [async]
* @param { string } dir the stylesheet directory
* @param { () => void } callback gets called when all the styles are loaded
*/
export function appendStyleDir(dir, callback)
{
  appendStyle(callback,
    ...readdirSync(dir)
      // get only .css files
      .filter((x) =>
      {
        return x.endsWith('.css');
      })
      // get the full path of the files
      .map((x) =>
      {
        return join(dir, x);
      }));
}

/** remove a stylesheet file from the dom
* @param { string } path to the stylesheet (css) file
*/
export function removeStyle(path)
{
  // if the file is really loaded
  if (appendedStyles[path] !== undefined)
  {
    // remove it from dom
    document.head.removeChild(appendedStyles[path]);

    // remove it from the list of loaded styles
    appendedStyles[path] = undefined;
  }
}

export function showSplashScreen()
{
  splash.style.display = 'block';
}

export function hideSplashScreen()
{
  splash.style.display = 'none';
}

/** add a block or a html element to the body
* @param { Block | HTMLElement } child
*/
export function append(child)
{
  document.body.appendChild(child.domElement || child);
}

/** remove a block or a html element from the body
* @param { Block | HTMLElement } child
*/
export function remove(child)
{
  document.body.removeChild(child.domElement || child);
}

/** if the body contains a block or a html element
* @param { Block | HTMLElement } child
* @returns { boolean }
*/
export function contains(child)
{
  return document.body.contains(child.domElement || child);
}

/** emits every time the user writes something into the search bar
* @param { (value: string) => void } callback the callback function
*/
export function onSearchBarInput(callback)
{
  registerCallback('onSearchBarInput', callback);
}

/** emits every time sulaiman regain focus
* @param { () => void } callback the callback function
*/
export function onFocus(callback)
{
  registerCallback('onFocus', callback);
}

/** emits every time sulaiman loses focus
* @param { () => void } callback the callback function
*/
export function onBlur(callback)
{
  registerCallback('onBlur', callback);
}