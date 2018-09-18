import { remote } from 'electron';
import * as settings from 'electron-json-config';

import request from 'request-promise-native';
import wget from 'node-wget-promise';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import AutoLaunch from 'auto-launch';

import { Card, createCard, appendCard, removeCard, on } from './api.js';

const { showHide, setSkipTaskbar, quit, relaunch } = remote.require(join(__dirname, '../main/window.js'));

const autoLaunchEntry = new AutoLaunch({ name: 'Sulaiman', isHidden: true });

export let autoHide = false;

export function loadOptions()
{
  if (process.env.DEBUG)
    return;
  
  loadAutoLaunch();
  loadShowHideKey();

  checkForSulaimanUpdates();
}

export function registerOptionsPhrase()
{
  const card = on.phrase('Options', [ 'Show/Hide Key', 'Auto-Launch', 'Tray' ],
    (argument) =>
    {
      if (argument === 'Show/Hide Key')
      {
        card.reset();
        card.domElement.onclick = undefined;

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
        card.reset();

        card.auto({ title: 'Loading Current Settings..' });
        card.setType({ type: 'Disabled' });

        autoLaunchEntry.isEnabled()
          .then((enabled) =>
          {
            const toggle = createCard();
            
            card.auto({ title: '' });
            
            card.appendChild(toggle);
            const text = card.appendText('Auto-Launch');
            
            card.setType({ type: 'Normal' });
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
        card.reset();
        card.auto();

        let enabled = settings.get('trayIcon', true);
        const toggle = createCard();

        card.appendChild(toggle);

        const toggleText = card.appendText('Tray');
        
        toggle.setType({ type: 'Toggle', state: enabled });
        
        card.appendLineBreak();

        const warningText = card.appendText('This option needs the app to relaunch to be applied');

        const relaunchButton = createCard({ title: 'Relaunch' });
        relaunchButton.setType({ type: 'Button' });

        card.appendChild(relaunchButton);

        relaunchButton.domElement.onclick = () => relaunch();
        
        relaunchButton.domElement.style.display = warningText.style.display = 'none';

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
          {
            relaunchButton.domElement.style.cssText = warningText.style.cssText = '';
          }
        };
      }
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
      if (isEnabled)
        return;
      
      autoLaunchCard.appendText('Would you like');
      autoLaunchCard.appendText('if Sulaiman auto launches itself on startup?', { type: 'Description' });
  
      const yesButton = createCard({ title: 'Yes' });
      yesButton.setType({ type: 'Button' });
      autoLaunchCard.appendChild(yesButton);
  
      yesButton.domElement.onclick = () =>
      {
        autoLaunchEntry.enable();
      
        removeCard(autoLaunchCard);
      };
  
      const noButton = createCard({ title: 'No' });
      noButton.setType({ type: 'Button' });
      autoLaunchCard.appendChild(noButton);
  
      noButton.domElement.onclick = () =>
      {
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

    if (card.isPhrased)
    {
      card.reset();
      card.auto({ title: 'The new shortcut has been applied' });
      card.setType({ type: 'Disabled' });
    }
    else
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

    keysElem.innerText = keys.join(' + ');

    if (keys.length > 1 && checkGlobalShortcut(keys.join('+')))
      setButtonCard.setType({ type: 'Button' });
    else
      setButtonCard.setType({ type: 'Disabled' });
  };

  const cancelKeyCapture = () =>
  {
    exists = settings.has(key);

    keysElem.style.display = 'none';

    if (exists)
    {
      cancelButton.innerText = 'Remove';
  
      cancelButtonCard.domElement.onclick = removeKey;
    }
    else
    {
      cancelButton.innerText = 'Cancel';

      cancelButtonCard.domElement.style.display = 'none';
    }

    setButton.innerText = 'Set';

    setButtonCard.domElement.onclick = startKeyCapture;
    setButtonCard.setType({ type: 'Button' });

    window.removeEventListener('keydown', keyCapture);
  };

  const startKeyCapture = () =>
  {
    keysElem.style.cssText = '';

    cancelButton.innerText = 'Cancel';

    cancelButtonCard.domElement.onclick = cancelKeyCapture;
    cancelButtonCard.domElement.style.cssText = '';
      
    keysElem.innerText = 'Press The Keys';
    setButton.innerText = 'Apply';

    setButtonCard.domElement.onclick = () =>
    {
      done(keys.join('+'));

      cancelKeyCapture();
    };

    setButtonCard.setType({ type: 'Disabled' });

    window.addEventListener('keydown', keyCapture);
  };

  const removeKey = () =>
  {
    if (unregisterGlobalShortcut(settings.get(key, undefined)))
    {
      settings.delete(key);

      cancelButtonCard.domElement.style.display = 'none';

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

function checkForSulaimanUpdates()
{
  function check(serverBuild)
  {
    // if commit id of the server is different, and
    // the current package has a download url in the server
    if (serverBuild.commit !== localBuild.commit && serverBuild[localBuild.package])
    {
      const progress = function(info)
      {
        const percentage = Math.floor(info.percentage * 100);

        descriptionText.innerText = 'Downloading.. ' + percentage + '%';

        card.setType({ type: 'ProgressBar', percentage: percentage });
      };

      const downloadError = function(err)
      {
        updateButton.domElement.style.cssText = '';

        updateButton.auto({ title: 'Retry' });
        descriptionText.innerText = 'Download Error\n' + err.message;

        card.setType({ type: 'Normal' });
      };
      
      const done = function(path)
      {
        updateButton.domElement.style.cssText = '';

        updateButton.auto({ title: 'Install' });
        updateButton.domElement.onclick = () => install(path);

        descriptionText.innerText = 'Downloaded';

        card.setType({ type: 'Normal' });
      };

      const install = function(path)
      {
        remote.shell.openItem(path);

        quit();
      };

      const download = function()
      {
        const url = new URL(serverBuild[localBuild.package]);
        const filename = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);

        const output = join(tmpdir(), filename);

        updateButton.domElement.style.display = dismissButton.domElement.style.display = 'none';
      
        descriptionText.innerText = 'Downloading..';
        
        wget(url.href, { output: output, onProgress: progress })
          .then(() => done(output))
          .catch((err) => downloadError(err));
      };

      const dismiss = function()
      {
        removeCard(card);
      };

      const card = createCard({ title: 'Sulaiman' });

      const updateButton = createCard({ title: 'Update' });
      updateButton.setType({ type: 'Button' });
      updateButton.domElement.onclick = download;
      
      const dismissButton = createCard({ title: 'Dismiss' });
      dismissButton.setType({ type: 'Button' });
      dismissButton.domElement.onclick = dismiss;

      const descriptionCard = createCard();
      const descriptionText = descriptionCard.appendText('Update Available', ({ type: 'Description' }));

      descriptionCard.domElement.style.pointerEvents = 'none';

      card.appendChild(descriptionCard);
      card.appendLineBreak();
      
      card.appendChild(updateButton);
      card.appendChild(dismissButton);

      appendCard(card);
    }
  }

  const buildPath = join(__dirname, '../../build.json');

  // if the build.json file doesn't exists, then return
  if (!existsSync(buildPath))
    return;

  /** @type { { build: string, commit: string, date: string, package: string }  }
  */
  const localBuild = JSON.parse(readFileSync(join(__dirname, '../../build.json')).toString());

  // if the package is not specified, then return
  if (!localBuild.package)
    return;

  // request the server's build.json, can fail silently
  request(
    'https://gitlab.com/herpproject/Sulaiman/-/jobs/artifacts/release/raw/build.json?job=build', {  json: true })
    .then((serverBuild) => check(serverBuild));
}