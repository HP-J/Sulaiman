import { join } from 'path';
import { readdirSync } from 'fs';

import Card from './card.js';

export { createCard } from './card.js';
export { setPlaceholder } from './searchBar.js';
export { on, off } from './loader.js';

export { Card };

/** [needs a permission]
* the main window of the app
* @type { Electron.BrowserWindow }
*/
export const window = undefined;

/** [needs a permission]
* access to read & write to clipboard
* @type { Electron.Clipboard }
*/
export const clipboard = undefined;

/** [needs a permission]
* @type { Electron.Shell }
*/
export const shell = undefined;

/** [needs a permission]
* @type { Electron.Dialog }
*/
export const dialog = undefined;

/** when a new icon is loaded it gets cached in this
* object so it can be cloned if requested again
* @type { Object.<string, HTMLElement> }
*/
const storedIcons = {};

/** @type { Object.<string, HTMLElement[]> }
*/
const appendedStyles = {};

const iconStyles = [];

/** add an icon to store
* @param { string } path a full path to the icon
* @param { string } iconName give the icon a name that will be used later to pull it from store
*/
export function storeIcon(path, iconName)
{
  // check if an icon with that name is already loaded
  if (storedIcons[iconName] !== undefined)
    throw 'an icon with that name already exists';

  if (!path.endsWith('.svg'))
    throw 'sulaiman only supports SVG icons';

  const icon = document.createElement('object');

  icon.type = 'image/svg+xml';
  icon.data = path;

  icon.className = 'cardIcon';

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
  {
    const icon = storedIcons[iconName].cloneNode(true);

    icon.onload = () =>
    {
      const svgDocument = icon.contentDocument;
      const svgElem = svgDocument.querySelector('svg');

      for (let i = 0; i < iconStyles.length; i++)
      {
        const style = svgDocument.createElementNS('http://www.w3.org/2000/svg', 'style');
      
        svgElem.setAttribute('class', 'cardIcon');

        style.textContent = '@import url("' + iconStyles[i] + '");';

        svgElem.insertBefore(style, svgElem.firstChild);
      }
    };

    return icon;
  }
  else
    return undefined;
}

/** append a stylesheet files to the DOM [async]
 * @param { string[] } files paths to the stylesheets (css) files to want to append to DOM
* @param { () => void } callback gets called when all the styles are loaded
*/
export function appendStyle(files, callback)
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
      if (files.length === length && callback)
        callback();
    };

    // append the style to the DOM
    document.head.appendChild(style);
  }
}

/** remove a list of stylesheet files from the DOM
* @param { string[] } files paths to the stylesheets (css) files to want to remove from DOM
*/
export function removeStyle(files)
{
  for (let i = 0; i < files.length; i++)
  {
    // if the file is really loaded
    if (appendedStyles[files[i]] !== undefined)
    {
      // remove it from dom
      document.head.removeChild(appendedStyles[files[i]]);

      // remove it from the list of loaded styles
      delete appendedStyles[files[i]];
    }
  }
}

/** append all the stylesheet files from a directory to the DOM [async]
* @param { string } directory the stylesheet directory
* @param { () => void } callback gets called when all the styles are loaded
*/
export function appendStyleDir(directory, callback)
{
  appendStyle(readdirSync(directory)
    // get only .css files
    .filter((x) =>
    {
      return x.endsWith('.css');
    })
    // get the full path of the files
    .map((x) =>
    {
      return join(directory, x);
    }), callback);
}

/** if you have a class that you added to an svg, the file that has this class in it has to be added through this function
* since rendering files from files with css styling is super weird for some reason
* @param { string | string[] } files paths to the stylesheets (css) files to want to append to icons
*/
export function addIconStyle(files)
{
  iconStyles.push(files);
}

/** add the card to the body
* @param { Card } card
*/
export function appendCard(card)
{
  if (card instanceof Card)
    document.body.appendChild(card.domElement);
  else
    throw TypeError('card is not an instance of Card');
}

/** remove the card from the body
* @param { Card } card
*/
export function removeCard(card)
{
  if (card instanceof Card)
    document.body.removeChild(card.domElement);
  else
    throw TypeError('card is not an instance of Card');
}

/** if the body contains the card
* @param { Card } card
*/
export function containsCard(card)
{
  if (card instanceof Card)
    return document.body.contains(card.domElement);
  else
    throw TypeError('card is not an instance of Card');
}

export let createElement = document.createElement;
createElement = createElement.bind(document);

export let createElementNS = document.createElementNS;
createElementNS = createElement.bind(document);