import { remote } from 'electron';

import * as searchBar from './searchBar.js';

import { loadExtensions, emitCallbacks, loadedExtensions } from './registry.js';

export const splash = document.body.children[0];

export const mainWindow = remote.getCurrentWindow();

import { appendExtensionCard } from './control.js';
import { Card, appendChild, getIcon } from './api.js';

/** executes the callback when the DOM has completed any running operations
* @param { () => void } callback
*/
export function isDOMReady(callback)
{
  if (document.readyState === 'complete')
    callback();
  else
    window.setTimeout(() =>
    {
      isDOMReady(callback);
    }, 100);
}

/** reloads the electron browser window
*/
export function reload()
{
  mainWindow.reload();
}

function registerEvents()
{
  mainWindow.on('focus', onfocus);
  mainWindow.on('blur', onblur);

  // back-arrow 37
  // up-arrow 38
  // forward-arrow 39
  // down-arrow 40

  window.onkeydown = (event) =>
  {
    // TAB
    if (event.keyCode === 9)
      event.preventDefault();
  };

  window.onkeyup = () =>
  {
    // F5
    if (event.keyCode === 116)
      mainWindow.reload();
  };

  // window.onkeypress = () =>
  // {
  // };
}

/** gets called when the application gets focus
*/
function onfocus()
{
  // emits the event to extensions
  emitCallbacks('onFocus');
}

/** gets called when the application gets unfocused
*/
function onblur()
{
  // emits the event to extensions
  emitCallbacks('onBlur');
}

// create and append the search bar
searchBar.append();
    
// register elements events and track key presses
registerEvents();

// load all extensions
loadExtensions();

//

const parent = new Card();

const progressBar = new Card();

parent.appendChild(progressBar);

appendChild(parent);

let progress = 0;

function setProgress()
{
  progressBar.auto({ title: progress + '%' });

  progressBar.style.background = 'linear-gradient(90deg, rgba(18,18,190,1) ' + progress + '%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 100%)';

  if (progress < 100)
    setTimeout(() =>
    {
      setProgress(progress++);
    }, 50);
}

setProgress();

//

// for (const extension in loadedExtensions)
// {
//   appendExtensionCard(loadedExtensions[extension], 'Delete');

//   break;
// }

// api.onSearchBarInput((value) =>
// {
//   if (value.startsWith('ext'))
//   {
//     if (!ext.contains(installedCard))
//       ext.append(installedCard);
//   }
//   else
//   {
//     if (ext.contains(installedCard))
//       ext.remove(installedCard);
//   }
// });

// reset focus
onfocus();

// hide the splash screen when the dom is ready
isDOMReady(() =>
{
  splash.style.display = 'none';
});