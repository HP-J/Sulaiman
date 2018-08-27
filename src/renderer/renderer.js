import { remote } from 'electron';

import * as searchBar from './searchBar.js';

import { loadExtensions, emitCallbacks } from './loader.js';

import { loadNPM } from './manager.js';
import { Card, appendChild, removeChild } from './api.js';

export const splash = document.body.children[0];

export const mainWindow = remote.getCurrentWindow();

const app = remote.app;

let autoHide = false;

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

  app.on('second-instance', () =>
  {
    show();
  });

  window.addEventListener('keydown', (event) =>
  {
    if (event.code === 'Tab')
      event.preventDefault();
  });
}

function show(showInTaskbar)
{
  mainWindow.restore();

  mainWindow.show();

  mainWindow.setSkipTaskbar(!showInTaskbar);
  
  mainWindow.focus();
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
  if (autoHide)
    mainWindow.hide();

  // emits the event to extensions
  emitCallbacks('onBlur');
}

// create and append the search bar
searchBar.append();
    
// register elements events and track key presses
registerEvents();

// load all extensions
loadExtensions();

// load npm
loadNPM();

// reset focus
onfocus();

function registerGlobalShortcut(key, callback)
{
  // if (!remote.globalShortcut.isRegistered(key))
  // {
  //   remote.globalShortcut.register(key, callback);
  // }
  // else
  // {
  //   return false;
  // }

  return false;
}

function onceForAll(key, busyKey)
{
  if (!key)
  {
    const mainCard = new Card({
      title: (!busyKey) ?
        'Hello There,' :
        'Sorry, It looks like',
      description: (!busyKey) ?
        'It looks like it\'s your first time using Sulaiman, Start by choosing a shortcut for summoning the application anytime you need it.' :
        'A different application is using the shortcut you selected for summoning Sulaiman; we recommend to setting a new one.',
    });
    
    const buttonCard = new Card();
    
    const keys = mainCard.appendText('', { size: 'Big', style: 'Bold' });
    keys.style.display = 'none';

    mainCard.appendLineSeparator();
    
    const button = buttonCard.appendText('Set', { align: 'Center' });
    
    mainCard.appendChild(buttonCard);
    
    appendChild(mainCard);

    /** @param {KeyboardEvent} event
     */
    const keyCapture = (event) =>
    {
      keys.innerText = '';

      if (event.ctrlKey)
        keys.innerText += 'Control+';

      if (event.altKey)
        keys.innerText += 'Alt+';

      if (event.shiftKey)
        keys.innerText += 'Shift+';

      if (!keys.innerText.includes(event.key) && !keys.innerText.includes(event.code))
        keys.innerText += event.key.toUpperCase();
    };

    const endKeyCapture = () =>
    {
    };

    const startKeyCapture = () =>
    {
      buttonCard.disable();
      
      keys.style.cssText = '';
      keys.innerText = 'Press Any Key';
      
      button.innerText = 'Apply';

      window.addEventListener('keydown', keyCapture);
      window.addEventListener('keyup', endKeyCapture);
    };

    buttonCard.events.onclick = startKeyCapture;

    show();
  }
  else
  {
    if (registerGlobalShortcut(key, show))
    {
      autoHide = true;

      // window.onkeydown = (event) =>
      // {

      // };
    }
    else
    {
      onceForAll(undefined, key);
    }
  }
}

onceForAll(localStorage.getItem('showHideKey'));

// hide the splash screen when the dom is ready
isDOMReady(() =>
{
  splash.style.display = 'none';
});