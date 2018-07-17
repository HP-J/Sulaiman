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

ext.storeIcon(join(__dirname, '../extensions/default-dark/icons/expand.svg'), 'expand');
ext.storeIcon(join(__dirname, '../extensions/default-dark/icons/search.svg'), 'search');

const installedBlock = new Block();

installedBlock.auto(
  {
    title: 'Installed Extensions',
    actionIcon: ext.getIcon('expand'),
    extensionIcon: ext.getIcon('search'),
    parent: true
  });

for (const extension in loadedExtensions)
{
  const block = new Block();

  block.auto(
    {
      description: loadedExtensions[extension].sulaiman.displayName,
      child: true
    });

  installedBlock.domElement.appendChild(block.domElement);
}

ext.append(installedBlock);

// TODO finish
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
}, 10000);