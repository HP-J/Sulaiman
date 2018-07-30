import { remote } from 'electron';

import * as searchBar from './searchBar.js';

import { loadExtensionsDir, emitCallbacks, loadedExtensions } from './registry.js';

import * as ext from './extension.js';

import * as api from './extension.js';
import Block from './block.js';
import { join } from 'path';

export const splash = document.body.children[0];

export const mainWindow = remote.getCurrentWindow();

// TODO apps
// auto-start
// check for sulaiman updates and download packages if on AppImages, Windows or DMG
// calculator
// google
// files

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
  if (!process.env.DEBUG)
    mainWindow.hide();
  
  // emits the event to extensions
  emitCallbacks('onBlur');
}

// create and append search bar block
searchBar.append();
    
// register elements events and track key presses
registerEvents();

// load all extensions
loadExtensionsDir();

// TODO finish the extensions control room ()

// TODO maybe a way to add empty space (line breaks) that gets controlled by css themes

ext.storeIcon(join(__dirname, '../extensions/default-dark/icons/expand.svg'), 'expand');
ext.storeIcon(join(__dirname, '../extensions/default-dark/icons/search.svg'), 'search');

// for (const extension in loadedExtensions)
{
  const extension = loadedExtensions['sulaiman-extension-debug'];

  const block = new Block(
    {
      title: extension.sulaiman.displayName,
      description: extension.description,
      actionIcon: ext.getIcon('expand')
    });

  // TODO show all permissions then all modules
  // TODO highlight dangerous permissions and modules according to an encoded list

  // const button = new Block();

  // button.appendTitle('install');

  // button.style.textAlign = 'center';
    
  // block.appendChild(button);

  //

  ext.appendChild(block);
}

// api.onSearchBarInput((value) =>
// {
//   if (value.startsWith('ext'))
//   {
//     if (!ext.contains(installedBlock))
//       ext.append(installedBlock);
//   }
//   else
//   {
//     if (ext.contains(installedBlock))
//       ext.remove(installedBlock);
//   }
// });

// reset focus
onfocus();

// set a timeout to hide the splash screen to give a chance to
// extensions that leverages it to hide it themselves
setTimeout(() =>
{
  api.hideSplashScreen();
}, 5000);