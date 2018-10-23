import { remote } from 'electron';
import * as settings from 'electron-json-config';

import request from 'request-promise-native';

import { readFile, pathExists as exists } from 'fs-extra';
import { join } from 'path';
import { tmpdir } from 'os';

import AutoLaunch from 'auto-launch';

import { internalRegisterPhrase as registerPhrase } from './search.js';
import { internalCreateCard as createCard } from './card.js';

import { appendCard, removeCard } from './api.js';

/** @typedef { import('./card.js').default } Card
*/

/** @typedef { import('./loader').PackageData } PackageData
*/

/** @type {{ download: (win: Electron.BrowserWindow, url: string, options: { saveAs: boolean, directory: string, filename: string, openFolderWhenDone: boolean, showBadge: boolean, onStarted: (item: Electron.DownloadItem) => void, onProgress: (percentage: number) => void, onCancel: () => void }) => Promise<Electron.DownloadItem> }}
*/
const { download: dl  } = remote.require('electron-dl');

const { mainWindow, isDebug, showHide, setSkipTaskbar, quit } = remote.require(join(__dirname, '../main/window.js'));

const autoLaunchEntry = new AutoLaunch({ name: 'Sulaiman', isHidden: true });

export let autoHide = false;

export function loadOptions()
{
  if (isDebug())
    return;
  
  loadAutoLaunch();
  loadShowHideKey();

  const updateCard = createCard();

  checkForSulaimanUpdates(updateCard).then((update) =>
  {
    if (update)
      appendCard(updateCard);
  });
}

export function registerOptionsPhrase()
{
  return new Promise((resolve) =>
  {
    const optionsPhrase = registerPhrase('Options', [ 'Keys Show/Hide', 'Auto-Launch', 'Tray' ], {
      activate: (card, suggestion, match, argument) =>
      {
        card.reset();

        if (argument === 'Keys Show/Hide')
        {
          showChangeKeyCard(card, 'Show/Hide', 'Set a new shortcut key', 'showHideKey', showHide,
            () =>
            {
              autoHide = true;

              setSkipTaskbar(true);
            },
            () =>
            {
              autoHide = false;

              setSkipTaskbar(false);
            });
        }
        else if (argument === 'Auto-Launch')
        {
          card.auto({ title: 'Loading Current Settings..' });

          autoLaunchEntry.isEnabled()
            .then((enabled) =>
            {
              const toggle = createCard();

              card.auto({ title: '' });

              card.appendChild(toggle);
              const text = card.appendText('Auto-Launch');

              toggle.setType({ type: 'Toggle', state: enabled });

              toggle.domElement.onclick = text.onclick = () =>
              {
                card.setType({ type: 'Disabled' });

                if (enabled)
                {
                  autoLaunchEntry.disable().then(() =>
                  {
                    card.setType({ type: 'Normal' });
                    toggle.setType({ type: 'Toggle', state: false });

                    enabled = false;
                  });
                }
                else
                {
                  autoLaunchEntry.enable().then(() =>
                  {
                    card.setType({ type: 'Normal' });
                    toggle.setType({ type: 'Toggle', state: true });

                    enabled = true;
                  });
                }
              };
            });
        }
        else if (argument === 'Tray')
        {
          card.auto();

          let enabled = settings.get('trayIcon', true);

          const warningText = card.appendText('This option needs the app to restart to be applied', { style: 'Bold', size: 'Small' });
          card.appendLineBreak();

          const toggle = createCard();

          card.appendChild(toggle);

          const toggleText = card.appendText('Tray');

          toggle.setType({ type: 'Toggle', state: enabled });

          warningText.style.display = 'none';

          toggle.domElement.onclick = toggleText.onclick = () =>
          {
            if (enabled)
            {
              settings.set('trayIcon', false);
              toggle.setType({ type: 'Toggle', state: false });

              enabled = false;
            }
            else
            {

              settings.set('trayIcon', true);
              toggle.setType({ type: 'Toggle', state: true });

              enabled = true;
            }

            if (warningText.style.cssText)
              warningText.style.cssText = '';
          };
        }
      }
    });

    const aboutPhrase = registerPhrase('Sulaiman', [ 'About', 'Check for Updates' ], {
      activate: (card, suggestion, match, argument) =>
      {
        card.reset();

        if (argument === 'About')
        {
          card.auto({ title: 'Sulaiman' });

          card.auto({ description: 'Loading' });

          readJson('build.json').then((localData) =>
          {
            readJson('package.json').then((packageData) =>
            {
              card.auto({ description: '' });

              if (localData)
              {
                if (localData.branch)
                  card.appendText('Branch: ' + localData.branch, { type: 'Description', select: 'Selectable' });
  
                if (localData.commit)
                  card.appendText('Commit: ' + localData.commit, { type: 'Description', select: 'Selectable' });
  
                if (localData.package)
                  card.appendText('Package (' + localData.package + ')', { type: 'Description', select: 'Selectable' });

                if (localData.date)
                  card.appendText('Release Date: ' + localData.date, { type: 'Description', select: 'Selectable' });
              }

              if (packageData)
              {
                if (packageData.version)
                  card.appendText('API: ' + packageData.version, { type: 'Description', select: 'Selectable' });
              }
  
              if (process.versions.electron)
                card.appendText('Electron: ' + process.versions.electron, { type: 'Description', select: 'Selectable' });

              if (process.versions.chrome)
                card.appendText('Chrome: ' + process.versions.chrome, { type: 'Description', select: 'Selectable' });

              if (process.versions.node)
                card.appendText('Node.js: ' + process.versions.node, { type: 'Description', select: 'Selectable' });

              if (process.versions.v8)
                card.appendText('V8: ' + process.versions.v8, { type: 'Description', select: 'Selectable' });
            });
          });
        }
        else if (argument === 'Check for Updates')
        {
          checkForSulaimanUpdates(card);
        }
      }
    });

    Promise.all([ optionsPhrase, aboutPhrase ]).then(resolve);
  });
}

function loadShowHideKey()
{
  const showHideKeyCard = createCard();

  const showHideAccelerator = settings.get('showHideKey', undefined);

  if (!showHideAccelerator)
  {
    showChangeKeyCard(
      showHideKeyCard,
      'Hello there, ',
      'It looks like it\'s your first time using Sulaiman, Start by choosing a shortcut for summoning the application anytime you need it.',
      'showHideKey', showHide,
      () =>
      {
        autoHide = true;

        setSkipTaskbar(true);
      }
    );

    appendCard(showHideKeyCard);
  }
  else if (remote.globalShortcut.isRegistered(showHideAccelerator))
  {
    showChangeKeyCard(
      showHideKeyCard,
      'Sorry, It looks like',
      'A different application is using the shortcut you selected for summoning Sulaiman; we recommend to setting a new one.',
      'showHideKey', showHide,
      () =>
      {
        autoHide = true;

        setSkipTaskbar(true);
      }
    );

    appendCard(showHideKeyCard);
  }
  else
  {
    remote.globalShortcut.register(showHideAccelerator, showHide);

    autoHide = true;
    setSkipTaskbar(true);
  }
}

function loadAutoLaunch()
{
  const autoLaunchCard = createCard();

  autoLaunchEntry.isEnabled()
    .then((isEnabled) =>
    {
      if (isEnabled || settings.get('ignoreAutoLaunch', false))
        return;

      autoLaunchCard.appendText('Would you like,');
      autoLaunchCard.appendText('If Sulaiman auto launches itself on startup?', { type: 'Description' });

      const yesButton = createCard({ title: 'Yes' });
      yesButton.setType({ type: 'Button' });
      autoLaunchCard.appendChild(yesButton);

      yesButton.domElement.onclick = () =>
      {
        autoLaunchEntry.enable();

        removeCard(autoLaunchCard);
      };

      const dismissButton = createCard({ title: 'Dismiss' });
      dismissButton.setType({ type: 'Button' });
      autoLaunchCard.appendChild(dismissButton);

      dismissButton.domElement.onclick = () =>
      {
        settings.set('ignoreAutoLaunch', true);

        removeCard(autoLaunchCard);
      };

      appendCard(autoLaunchCard);
    });
}

/** @param { Card } card
* @param { string } title
* @param { string } description
* @param { string } key
* @param { () => void } callback
* @param { () => void } [done]
* @param { () => void } [remove]
*/
function showChangeKeyCard(card, title, description, key, callback, done, remove)
{
  card.auto({ title: title, description: description });

  captureKey(card, key, (accelerator) =>
  {
    unregisterGlobalShortcut(settings.get(key, undefined));

    settings.set(key, accelerator);

    remote.globalShortcut.register(accelerator, callback);

    if (!card.isPhrased)
    {
      removeCard(card);
    }

    if (done)
      done();
  }, () =>
  {
    if (remove)
      remove();
  });
}

/** make the card apply to capture key downs and turns them to accelerators
* @param { Card } card
* @param { (accelerator: Electron.Accelerator) => void } done
* @param { () => void } remove
*/
function captureKey(card, key, done, remove)
{
  let exists;

  const keys = [];

  const keysElem = card.appendText('', { size: 'Big', style: 'Bold' });

  card.appendLineBreak();

  const setButtonCard = createCard();
  const setButton = setButtonCard.appendText('', { align: 'Center' });
  setButtonCard.setType({ type: 'Button' });
  card.appendChild(setButtonCard);

  const cancelButtonCard = createCard();
  const cancelButton = cancelButtonCard.appendText('', { align: 'Center' });
  cancelButtonCard.setType({ type: 'Button' });
  card.appendChild(cancelButtonCard);

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

    keysElem.innerText = keys.join('+');

    if (keys.length > 1 && checkGlobalShortcut(keys.join('+')))
      setButtonCard.setType({ type: 'Button' });
    else
      setButtonCard.setType({ type: 'Disabled' });
  };

  const cancelKeyCapture = () =>
  {
    exists = settings.get(key);
    
    setButtonCard.setType({ type: 'Button' });

    if (exists)
    {
      keysElem.innerText = exists;

      setButton.innerText = 'Change';
      cancelButton.innerText = 'Remove';
      
      cancelButtonCard.domElement.onclick = removeKey;
    }
    else
    {
      keysElem.style.display = 'none';
      cancelButtonCard.domElement.style.display = 'none';
      
      setButton.innerText = 'Set';
      cancelButton.innerText = 'Cancel';
    }
    
    setButtonCard.domElement.onclick = startKeyCapture;

    window.removeEventListener('keydown', keyCapture);
  };

  const startKeyCapture = () =>
  {
    keysElem.style.cssText = '';
    cancelButtonCard.domElement.style.cssText = '';
    
    
    setButtonCard.setType({ type: 'Disabled' });

    keysElem.innerText = 'Press The Keys';
    setButton.innerText = 'Apply';
    cancelButton.innerText = 'Cancel';
    
    cancelButtonCard.domElement.onclick = cancelKeyCapture;

    setButtonCard.domElement.onclick = () =>
    {
      done(keys.join('+'));

      cancelKeyCapture();
    };

    window.addEventListener('keydown', keyCapture);
  };

  const removeKey = () =>
  {
    if (unregisterGlobalShortcut(settings.get(key, undefined)))
    {
      settings.delete(key);

      cancelKeyCapture();

      remove();
    }
  };

  cancelKeyCapture();
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

/**
* @param { Electron.Accelerator } accelerator
*/
function unregisterGlobalShortcut(accelerator)
{
  try
  {
    if (remote.globalShortcut.unregister(accelerator))
      return false;
    else
      return true;
  }
  catch (err)
  {
    return false;
  }
}


/** @param { "build.json" | "package.json" } filename
* @returns { Promise<{ branch: string, commit: string, date: string, package: string } | PackageData> }
*/
function readJson(filename)
{
  return new Promise((resolve) =>
  {
    const jsonPath = join(__dirname, '../../', filename);

    exists(jsonPath).then((does) =>
    {
      if (does)
        return readFile(jsonPath);
      else
        resolve(undefined);
    })
      .then((buffer) =>
      {
        if (buffer)
          resolve(JSON.parse(buffer.toString()));
        else
          resolve(undefined);
      });
  });
}

/** @param { Card } card
* @returns { Promise<boolean> }
*/
function checkForSulaimanUpdates(card)
{
  return new Promise((resolve) =>
  {
  /** @param { { build: string, branch: string, commit: string, date: string } } remoteData
  */
    function check(localData, remoteData)
    {
      // if commit id of the server is different, and
      // the current package has a download url in the server
      if (remoteData.commit !== localData.commit && remoteData[localData.package])
      {
        const progress = function(percentage)
        {
          percentage = Math.floor(percentage * 100);

          card.auto({ description: 'Downloading ' + percentage + '%' });

          card.setType({ type: 'ProgressBar', percentage: percentage });
        };

        const downloadError = function(err)
        {
          if (err && err.canceled)
          {
            reset();
            return;
          }

          updateButton.domElement.style.cssText = '';

          updateButton.auto({ title: 'Retry' });

          card.auto({ description: 'Error: ' + err.message });

          card.setType({ type: 'Normal' });
        };

        /** @param { string } path
        */
        const done = function(path)
        {
          updateButton.domElement.style.cssText = '';

          updateButton.auto({ title: 'Install' });
          updateButton.domElement.onclick = () => install(path);

          if (card.isPhrased)
          {
            dismissButton.domElement.style.display = 'none';
          }
          else
          {
            dismissButton.auto({ title: 'Dismiss' });
            dismissButton.domElement.onclick = dismiss;
          }

          card.auto({ description: 'Downloaded' });

          card.setType({ type: 'Normal' });
        };

        const install = function(path)
        {
          remote.shell.openItem(path);

          quit();
        };

        const download = function()
        {
          updateButton.domElement.style.display = 'none';
          dismissButton.domElement.style.cssText = '';

          const url = new URL(remoteData[localData.package]);
          const filename = 'tmp-' + Date.now() + '-' + url.pathname.substring(url.pathname.lastIndexOf('/') + 1);

          card.auto({ description: 'Downloading..' });

          dismissButton.auto({ title: 'Cancel' });

          dl(mainWindow, url.href,
            {
              directory: tmpdir(),
              filename: filename,
              showBadge: false,
              onStarted: (item) => dismissButton.domElement.onclick = () => item.cancel(),
              onProgress: progress,
              onCancel: reset
            })
            .then(() => done(join(tmpdir(), filename)))
            .catch((err) => downloadError(err.cause || err));
        };

        const dismiss = function()
        {
          removeCard(card);
        };

        const reset = function()
        {
          updateButton.domElement.style.cssText = dismissButton.domElement.style.cssText = '';

          updateButton.auto({ title: 'Update' });
          updateButton.domElement.onclick = download;

          if (card.isPhrased)
          {
            dismissButton.domElement.style.display = 'none';
          }
          else
          {
            dismissButton.auto({ title: 'Dismiss' });
            dismissButton.domElement.onclick = dismiss;
          }

          card.auto({ description: 'Update available' });
          card.setType({ type: 'Normal' });
        };

        const updateButton = createCard();
        updateButton.setType({ type: 'Button' });

        const dismissButton = createCard();
        dismissButton.setType({ type: 'Button' });

        reset();

        card.appendLineBreak();

        card.appendChild(updateButton);
        card.appendChild(dismissButton);

        resolve(true);
      }
      else
      {
        card.auto({ description: 'Up-to-date' });

        resolve(false);
        return;
      }
    }

    card.auto({ title: 'Sulaiman', description: 'Checking for updates' });

    readJson('build.json').then((localData) =>
    {
    // if build.json doesn't exists or if the package is not specified, then return
      if (!localData || !localData.branch || !localData.commit || !localData.package)
      {
        card.auto({ description: 'Local build is missing its information' });

        resolve(false);
        return;
      }

      // request the server's build.json, can fail silently
      request('https://gitlab.com/herpproject/Sulaiman/-/jobs/artifacts/' + localData.branch + '/raw/build.json?job=build', {  json: true })
        .then((remoteData) =>
        {
          check(localData, remoteData);
        })
        .catch(() =>
        {
          card.auto({ description: 'Failed to reach server' });

          resolve(false);
          return;
        });
    });
  });
}