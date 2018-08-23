import { remote, shell } from 'electron';

import * as searchBar from './searchBar.js';

import { loadExtensions, emitCallbacks } from './loader.js';

import { extensionDeleteCard, getExtensionInstallCard, extensionInstallCard, loadNPM, showInstalledExtensions , checkForExtensionsUpdates } from './manager.js';
import { onSearchBarInput, removeChild, appendChild, Card } from './api.js';

import { readdir, existsSync, readFileSync } from 'fs-extra';
import { parse } from 'path';
import { homedir } from 'os';
import { exec } from 'child_process';

export const splash = document.body.children[0];

export const mainWindow = remote.getCurrentWindow();


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

// load npm
loadNPM();

// const appDirectories = [ '/usr/share/applications/', '/usr/local/share/applications/', homedir + '/.local/share/applications/' ];

// const appExtension = '.desktop';

// /**
// * @param { string[] } appDirectories
// * @param { string } appExtension
// */
// function getAppList(appDirectories, appExtension)
// {
//   return new Promise((resolve, reject) =>
//   {
//     const funcs = [];

//     for (let i = 0; i < appDirectories.length; i++)
//     {
//       funcs.push(new Promise((resolve, reject) =>
//       {
//         if (existsSync(appDirectories[i]))
//         {
//           readdir(appDirectories[i])
//             .then((files) =>
//             {
//               const apps = [];

//               files.forEach((file) =>
//               {
//                 if (file.endsWith(appExtension))
//                 {
//                   const fileParsed = {};
                  
//                   file = readFileSync(appDirectories[i] + file).toString().split('\n');

//                   for (let i = 0; i < file.length; i++)
//                   {
//                     const splitIndex = file[i].indexOf('=');

//                     const key = file[i].substring(0, splitIndex);
//                     const value = file[i].substring(splitIndex + 1);

//                     if (key.length > 0 && value.length > 0)
//                       fileParsed[key] = value;
//                   }

//                   apps.push(fileParsed);
//                 }
//               });

//               resolve(apps);
//             })
//             .catch((err) =>
//             {
//               reject(err);
//             });
//         }
//         else
//         {
//           resolve(undefined);
//         }
//       }));
//     }
  
//     const apps = [];
  
//     Promise.all(funcs)
//       .then((directories) =>
//       {
//         directories.forEach((value) =>
//         {
//           if (value)
//             apps.push(...value);
//         });
    
//         resolve(apps);
//       })
//       .catch((err) =>
//       {
//         reject(err);
//       });
//   });
// }

// getAppList(appDirectories, appExtension).then((apps) =>
// {
//   // WIndows, Mac
//   // hell.openItem(app));

//   // Linux
//   // if NoDisplay is true don't show  the app on search
//   // Replace %u and other % arguments in exec script
//   // https://github.com/KELiON/cerebro/pull/62#issuecomment-276511320
//   // exec(apps[0].Exec.replace(/%./g, ''));
// });

// reset focus
onfocus();

// hide the splash screen when the dom is ready
isDOMReady(() =>
{
  splash.style.display = 'none';
});