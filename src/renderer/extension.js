import { readFileSync, readdirSync } from 'fs';

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
const storedIcons = {};

/** @type { Object.<string, HTMLElement[]> }
*/
const appendedStyles = {};

/** add an icon to store
* @param { string } path a full path to the icon
* @param { string } iconName give the icon a name that will be used later to pull it from store
*/
export function storeIcon(path, iconName)
{
  // check if an icon with that name is already loaded
  if (storedIcons[iconName] !== undefined)
    throw 'an icon with that name already exists';

  let icon;

  if (path.endsWith('.svg'))
    icon = svg(path);
  else if (path.endsWith('.png'))
    icon = image(path);
  else
    throw 'icon format not supported, supported formats are [ png, svg ]';

  // cache the icon with the required name
  storedIcons[iconName] = icon;
}

/** pull a copy of an icon from store
* @param { string } iconName the icon name
* @returns { HTMLElement } the icon wrapped in a html element
*/
export function getIcon(iconName)
{
  // check if an icon exists in store and returns it
  if (storedIcons[iconName] !== undefined)
    return storedIcons[iconName].cloneNode(true);
  else
    return undefined;
}

/** returns a list with all names of the available stored icons
* @returns { string[] } a list with the names of the stored icons
*/
export function getAllStoredIconsNames()
{
  const names = [];

  for (const name in storedIcons)
  {
    names.append(name);
  }

  return names;
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

/** remove a list of stylesheet files from the DOM
* @param { string[] } files paths to the stylesheets (css) files to want to remove from DOM
*/
export function removeStyle(...files)
{
  for (let i = 0; i < files.length; i++)
  {
    // if the file is really loaded
    if (appendedStyles[files[i]] !== undefined)
    {
      // remove it from dom
      document.head.removeChild(appendedStyles[files[i]]);

      // remove it from the list of loaded styles
      appendedStyles[files[i]] = undefined;
    }
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
export function appendChild(child)
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