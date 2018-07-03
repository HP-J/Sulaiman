import { existsSync, readFileSync } from 'fs';

import { domElement } from './page.js';

import { splash } from './renderer.js';

import { registerCallback, currentExtensionPath } from './registry.js';

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

/** append a stylesheet file to the dom
* @param { string } path to the stylesheet (css) file
*/
export function appendStyle(path, callback)
{
  // if the file is already loaded
  if (appendedStyles[currentExtensionPath] === undefined)
    appendedStyles[currentExtensionPath] = [];
  else if (appendedStyles[currentExtensionPath][path] !== undefined)
    throw 'this stylesheet file is already loaded';

  // create a link element
  const style = document.createElement('link');

  style.rel = 'stylesheet';
  style.href = path;

  appendedStyles[currentExtensionPath][path] = style;

  style.onload = callback;

  // append the style to the dom
  document.head.appendChild(style);
}

export function showSplashScreen()
{
  splash.style.display = 'block';
}

export function hideSplashScreen()
{
  splash.style.display = 'none';
}

/** remove a stylesheet file from the dom
* @param { string } path to the stylesheet (css) file
*/
export function removeStyle(path)
{
  // if the file is really loaded
  if (appendedStyles[currentExtensionPath] !== undefined &&
    appendedStyles[currentExtensionPath][path] !== undefined)
  {
    // remove it from dom
    document.head.removeChild(appendedStyles[currentExtensionPath][path]);

    // remove it from the list of loaded styles
    appendedStyles[currentExtensionPath][path] = undefined;
  }
}

/** add a block to the page
* @param { Block } block
*/
export function appendBlock(block)
{
  domElement.appendChild(block.domElement);
}

/** remove a block to the page
* @param { Block } block
*/
export function removeBlock(block)
{
  domElement.removeChild(block.domElement);
}

/** emits every time the user writes something into the search bar
* @param { () => any } callback the callback function
*/
export function onSearchInput(callback)
{
  registerCallback('onSearchInput', callback.name);
}