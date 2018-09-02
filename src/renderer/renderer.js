import { remote } from 'electron';

import * as searchBar from './searchBar.js';

import { loadExtensions, emit } from './loader.js';

import { loadNPM } from './manager.js';
import { Card, appendCard, removeCard } from './api.js';

export const splash = document.body.children[0];

export const mainWindow = remote.getCurrentWindow();

export const menuTemplate =
[
  {
    label: 'window',
    submenu:
  [
    {
      label: 'reload', accelerator: 'CmdOrCtrl+R', click()
      {
        reload();
      }
    },
    {
      label: 'zoom in', accelerator: 'CmdOrCtrl+=', role: 'zoomin'
    },
    {
      label: 'zoom out', accelerator: 'CmdOrCtrl+-', role: 'zoomout'
    },
    {
      label: 'reset zoom', accelerator: 'CmdOrCtrl+Shift+=', role: 'resetzoom'
    },
    {
      label: 'developer tools', accelerator: 'CmdOrCtrl+Shift+I', click()
      {
        mainWindow.webContents.toggleDevTools();
      }
    },
    {
      label: 'quit', accelerator: 'CmdOrCtrl+Q', click()
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

  const setButtonCard = new Card();
  const setButton = setButtonCard.appendText('Set', { align: 'Center' });
  card.appendChild(setButtonCard);

  const cancelButtonCard = new Card();
  cancelButtonCard.appendText('Cancel', { align: 'Center' });
  card.appendChild(cancelButtonCard);

  keysElem.style.display = 'none';
  cancelButtonCard.style.display = 'none';

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
    cancelButtonCard.style.display = 'none';

    setButton.innerText = 'Set';

    setButtonCard.events.onclick = startKeyCapture;
    setButtonCard.enable();

    window.removeEventListener('keydown', keyCapture);
  };

  const startKeyCapture = () =>
  {
    keysElem.style.cssText = '';
    cancelButtonCard.style.cssText = '';
      
    keysElem.innerText = 'Press The Keys';
    setButton.innerText = 'Apply';

    setButtonCard.events.onclick = () =>
    {
      callback(keys.join('+'));

      cancelKeyCapture();
    };

    setButtonCard.disable();

    window.addEventListener('keydown', keyCapture);
  };

  setButtonCard.events.onclick = startKeyCapture;
  cancelButtonCard.events.onclick = cancelKeyCapture;
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
    if (event.code === 'Tab')
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

  if (!savedAccelerator)
  {
    const card = new Card(
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
    const card = new Card(
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
  else if (process.env.DEBUG)
  {
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
searchBar.append();
    
// register to several events the app uses
registerEvents();

// replace the default application menu
updateMenu(menuTemplate);

// make sure the user has a show hide shortcut key
registerShowHideKey();

// load all extensions
loadExtensions();

// load npm
loadNPM();

// reset focus
onfocus();

// mark the app as ready
readyState = true;

emit.ready();

// const phrases =
// [
//   'extension test'.toLowerCase(),
//   'extension'.toLowerCase()
// ];

// const query = 'ext'.toLowerCase();

// function searchFor(query)
// {
//   for (let i = 0; i < phrases.length; i++)
//   {
//     const phrase = phrases[i];
  
//     let probability = 0;
  
//     if (phrase.includes(query))
//       probability = 100 - ((100 * query.length) / phrase.length);

//     setTimeout(() =>
//     {
//       console.log(phrase);
//     }, probability);
//   }
// }

// searchFor(query);

// searchBar.addPhrase('aa', a);
// searchBar.removePhrase('aa', a);

// function a()
// {
//   console.log('aa');
// }

// hide the splash screen when the dom is ready
isDOMReady(() =>
{
  splash.style.display = 'none';
});