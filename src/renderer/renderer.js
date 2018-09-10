import { remote } from 'electron';

import { appendSearchBar } from './searchBar.js';

import { loadExtensions, emit, on } from './loader.js';

import { loadNPM } from './manager.js';
import { Card, appendCard, removeCard, getIcon } from './api.js';
import { createCard } from './card.js';

export const mainWindow = remote.getCurrentWindow();

export const menuTemplate =
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

export let autoHide = false;

export let readyState = false;

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
    }
  ));
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

/**
* @param { Electron.Accelerator } accelerator
*/
function checkGlobalShortcut(accelerator)
{
  try
  {
    if (remote.globalShortcut.isRegistered(accelerator))
      return false;
    else
      return true;
  }
  catch (err)
  {
    return false;
  }
}

/** @param { Electron.MenuItemConstructorOptions[] } template
*/
function updateMenu(template)
{
  remote.Menu.setApplicationMenu(remote.Menu.buildFromTemplate(template));
}

/** make the card apply to capture key downs and turns them to accelerators
* @param { Card } card
* @param { (Electron.Accelerator) => void } callback
*/
function captureKey(card, callback)
{
  const keys = [];

  const keysElem = card.appendText('', { size: 'Big', style: 'Bold' });

  card.appendLineSeparator();

  const setButtonCard = createCard();
  const setButton = setButtonCard.appendText('Set', { align: 'Center' });
  card.appendChild(setButtonCard);

  const cancelButtonCard = createCard();
  cancelButtonCard.appendText('Cancel', { align: 'Center' });
  card.appendChild(cancelButtonCard);

  keysElem.style.display = 'none';
  cancelButtonCard.domElement.style.display = 'none';

  /** @param {KeyboardEvent} event
  */
  const keyCapture = (event) =>
  {
    keys.length = 0;

    if (event.ctrlKey)
      keys.push('Control');

    if (event.altKey)
      keys.push('Alt');

    if (event.shiftKey)
      keys.push('Shift');

    let code = event.key;

    if (code === ' ')
      code = 'Space';
      
    if (code === 'Meta')
      code = 'Alt';

    if (code === '+')
      code = 'Plus';

    if (!(/^[a-z]*$/).test(code) && event.code.startsWith('Key'))
      code = event.code.replace('Key', '');
      
    code = code[0].toUpperCase() + code.substring(1);

    if (!keys.includes(code))
      keys.push(code);

    keysElem.innerText = keys.join(' + ');

    if (checkGlobalShortcut(keys.join('+')))
      setButtonCard.enable();
    else
      setButtonCard.disable();
  };

  const cancelKeyCapture = () =>
  {
    keysElem.style.display = 'none';
    cancelButtonCard.domElement.style.display = 'none';

    setButton.innerText = 'Set';

    setButtonCard.domElement.onclick = startKeyCapture;
    setButtonCard.enable();

    window.removeEventListener('keydown', keyCapture);
  };

  const startKeyCapture = () =>
  {
    keysElem.style.cssText = '';
    cancelButtonCard.domElement.style.cssText = '';
      
    keysElem.innerText = 'Press The Keys';
    setButton.innerText = 'Apply';

    setButtonCard.domElement.onclick = () =>
    {
      callback(keys.join('+'));

      cancelKeyCapture();
    };

    setButtonCard.disable();

    window.addEventListener('keydown', keyCapture);
  };

  setButtonCard.domElement.onclick = startKeyCapture;
  cancelButtonCard.domElement.onclick = cancelKeyCapture;
}

/** shows/hides the main window
* @param { boolean } showInTaskbar
*/
function showHide(showInTaskbar)
{
  if (session.visible)
  {
    delete session.visible;
  }
  else if (!mainWindow.isVisible() || !mainWindow.isFocused())
  {
    mainWindow.restore();

    mainWindow.show();
  
    mainWindow.setSkipTaskbar(!showInTaskbar);
    
    mainWindow.focus();
  }
  else
  {
    mainWindow.hide();
  }
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

/** make sure the user has a show hide shortcut key
*/
function registerShowHideKey()
{
  function register(key)
  {
    remote.globalShortcut.register(key, showHide);

    localStorage.setItem('showHideKey', key);

    autoHide = true;
  }

  const savedAccelerator = localStorage.getItem('showHideKey');

  if (process.env.DEBUG)
  {
    showHide(true);
  }
  else if (!savedAccelerator)
  {
    const card = createCard(
      {
        title: 'Hello There,',
        description: 'It looks like it\'s your first time using Sulaiman, Start by choosing a shortcut for summoning the application anytime you need it.'
      });
    
    captureKey(card, (key) =>
    {
      register(key);

      removeCard(card);
    });

    appendCard(card);

    showHide(true);
  }
  else if (!checkGlobalShortcut(savedAccelerator))
  {
    const card = createCard(
      {
        title: 'Sorry, It looks like',
        description: 'A different application is using the shortcut you selected for summoning Sulaiman; we recommend to setting a new one.'
      });

    captureKey(card, (key) =>
    {
      register(key);

      removeCard(card);
    });

    appendCard(card);

    showHide(true);
  }
  else
  {
    register(savedAccelerator);
  }
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

// load all extensions
loadExtensions();

// load npm
loadNPM();

// mark the app as ready
readyState = true;

emit.ready();

on.phrase('extension', [
  'delete',
  'install'
]);

// make sure the user has a show hide shortcut key
registerShowHideKey();

// extensions / extensions install / extension delete
// search app list
// change the show/hide key

const element = createCard({ title: 'Hello', extensionIcon: getIcon('arrow') });

appendCard(element);

// remove the splash screen when the dom is ready
isDOMReady(() =>
{
  document.body.removeChild(splash);

  // reset focus
  onfocus();
});