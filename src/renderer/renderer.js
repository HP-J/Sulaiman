import { remote } from 'electron';

import { appendSearchBar } from './searchBar.js';
import { loadExtensions, emit, on } from './loader.js';
import { autoHide, loadOptions, registerOptionsPhrase } from './options.js';

import { loadNPM } from './manager.js';
import { appendCard, removeCard } from './api.js';
import Card, { createCard } from './card.js';

export const mainWindow = remote.getCurrentWindow();

const menuTemplate =
[
  {
    label: 'Window',
    submenu:
  [
    {
      label: 'Reload', accelerator: 'CmdOrCtrl+R', click()
      {
        reload();
      }
    },
    {
      label: 'Zoom In', accelerator: 'CmdOrCtrl+=', role: 'zoomin'
    },
    {
      label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomout'
    },
    {
      label: 'Reset Zoom', accelerator: 'CmdOrCtrl+Shift+=', role: 'resetzoom'
    },
    {
      label: 'Developer Tools', accelerator: 'CmdOrCtrl+Shift+I', click()
      {
        mainWindow.webContents.toggleDevTools();
      }
    },
    {
      label: 'Quit', accelerator: 'CmdOrCtrl+Q', click()
      {
        app.quit();
      }
    },
  ]
  }
];

export const app = remote.app;

export let readyState = true;

export let session;

const splash = document.body.children[0];

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
  storeSession();

  mainWindow.reload();
}

/** store a session, so it can be restored later
*/
function storeSession()
{
  localStorage.setItem('session', JSON.stringify(
    {
      visible: mainWindow.isVisible()
    }));
}

/** restores any stored session
*/
function restoreSession()
{
  session = localStorage.getItem('session');

  if (session)
    session = JSON.parse(session);
  else
    session = {};

  localStorage.removeItem('session');
}

/** @param { Electron.MenuItemConstructorOptions[] } template
*/
function updateMenu(template)
{
  remote.Menu.setApplicationMenu(remote.Menu.buildFromTemplate(template));
}

/** shows/hides the main window
* @param { boolean } showInTaskbar
*/
export function showHide()
{
  if (session.visible)
  {
    delete session.visible;
  }
  else if (!mainWindow.isVisible() || !mainWindow.isFocused())
  {
    mainWindow.restore();

    mainWindow.show();
      
    mainWindow.setSkipTaskbar(true);

    mainWindow.focus();
  }
  else
  {
    mainWindow.hide();
  }
}

/** @param { boolean } state
*/
export function skipTaskbar(state)
{
  mainWindow.setSkipTaskbar(state);
}

/** register to several events the app uses
*/
function registerEvents()
{
  mainWindow.on('focus', onfocus);
  mainWindow.on('blur', onblur);
  mainWindow.on('blur', onblur);

  app.on('second-instance', () =>
  {
    showHide();
  });

  window.addEventListener('keydown', (event) =>
  {
    if (event.key === 'Tab')
      event.preventDefault();
  });
}

function registerPhrases()
{
  registerOptionsPhrase();
}

/** gets called when the application gets focus
*/
function onfocus()
{
  emit.focus();
}

/** gets called when the application gets unfocused
*/
function onblur()
{
  if (autoHide)
    mainWindow.hide();
  
  emit.blur();
}

// if there is a stored session, restore it
restoreSession();

// create and append the search bar
appendSearchBar();
    
// register to several events the app uses
registerEvents();

// replace the default application menu
updateMenu(menuTemplate);

// load npm
loadNPM();

// load options
loadOptions();

// register sulaiman-related phrases
registerPhrases();

// mark the app as not ready to give all extensions a chance to load
// before they can run GUI-related functionally that may
// depend on a theme extension that hasn't loaded yet
readyState = false;

// load all extensions
loadExtensions();

// mark the app as ready
readyState = true;

// emit the ready event for extensions
emit.ready();

// on.phrase('extension',
//   [
//     'delete',
//     'install',
//     'running'
//   ], (argument, value) =>
//   {
//     console.log(argument.length + ' = ' + value.length);
//   }, () =>
//   {
//     console.log('entered');
//   });

// remove the splash screen when the dom is ready
isDOMReady(() =>
{
  if (splash)
    document.body.removeChild(splash);

  // reset focus
  onfocus();
});