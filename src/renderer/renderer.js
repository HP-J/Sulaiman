import { remote } from 'electron';

import * as searchBar from './elements.js';

import { loadExtensionsDir, emitCallbacks, loadedExtensions, PackageMeta } from './registry.js';

import * as ext from './extension.js';

import * as api from './extension.js';
import Card from './card.js';
import { join } from 'path';

export const splash = document.body.children[0];

export const mainWindow = remote.getCurrentWindow();

// TODO appendText should have options to choose from Text or Button

// TODO Install/Delete extensions from the npm registry
// TODO Show popular extensions from the npm registry

// TODO apps
// TODO check for updates and download packages (if on AppImages, Windows or DMG)
// TODO auto-start

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
  appendExtensionControlPanel(loadedExtensions[extension], 'Install');

  break;
}

/** @param { PackageMeta } extension
* @param { string } action
* @param { () => void } callback
*/
function appendExtensionControlPanel(extension, action, callback)
{
  const card = new Card(
    {
      title: extension.sulaiman.displayName,
      description: extension.description,
      actionIcon: ext.getIcon('expand')
    });

  // permissions section

  card.appendLineSeparator();

  const permissions = extension.sulaiman.permissions.join('\n');
  
  card.appendText('PERMISSIONS', { size: 'Smaller', style: 'Bold' });
  card.appendText(permissions, { type: 'Description', size: 'Smaller' });

  // modules section

  const modules = extension.sulaiman.modules.join('\n');

  card.appendText('MODULES', { size: 'Smaller', style: 'Bold' });
  card.appendText(modules, { type: 'Description', size: 'Smaller' });

  card.appendLineSeparator();

  // button section

  const button = new Card();

  button.appendText(action, { align: 'Center', style: 'Bold' });
    
  card.appendChild(button);

  // append the control panel card to body
  ext.appendChild(card);
  
  setTimeout(() =>
  {
    card.collapse();
  }, 1000);

  setTimeout(() =>
  {
    card.expand();
  }, 3000);
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