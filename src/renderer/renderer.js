import { remote } from 'electron';

import * as searchBar from './searchBar.js';

import { loadExtensionsDir, emitCallbacks, loadedExtensions } from './registry.js';

export const splash = document.body.children[0];

export const mainWindow = remote.getCurrentWindow();

import { appendExtensionCard } from './control.js';

// TODO apps
// TODO build (AppImages, MSI or DMG) using gitlab CLI and upload them to the gitlab releases
// TODO check for updates and download packages (if on AppImages, MIS or DMG)
// TODO auto-start

// TODO Show popular extensions from the npm registry

// calculator
// google
// files

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
loadExtensionsDir();

for (const extension in loadedExtensions)
{
  appendExtensionCard(loadedExtensions[extension], 'Install');

  break;
}

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