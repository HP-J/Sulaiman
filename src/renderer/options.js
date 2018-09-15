import { remote } from 'electron';

import request from 'request-promise-native';
import wget from 'node-wget-promise';

import AutoLaunch from 'auto-launch';

import { readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import { Card, createCard, appendCard, removeCard, on } from './api.js';
import { showHide, skipTaskbar } from './renderer.js';

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
  const card = on.phrase('Options', [ 'Show/Hide Key', 'Auto-Launch' ],
    (argument) =>
    {

      if (argument === 'Show/Hide Key')
      {
        card.reset();

        showChangeKeyCard(card, 'Show/Hide', 'Set a new shortcut key', 'showHideKey', showHide);
      }
      else if (argument === 'Auto-Launch')
      {
        card.reset();

        card.auto({ title: 'Loading Current Settings..' });
        card.setType({ type: 'Disabled' });

        autoLaunchEntry.isEnabled()
          .then((isEnabled) =>
          {
            card.auto({ title: '' });
            card.setType({ type: 'Normal' });

            const toggle = createCard();

            card.appendChild(toggle);
    
            card.appendText('Auto-Launch');
    
            toggle.setType({ type: 'Toggle', state: isEnabled });

            card.domElement.onclick = () =>
            {
              card.setType({ type: 'Disabled' });

              if (isEnabled)
              {
                autoLaunchEntry.disable().then(() =>
                {
                  toggle.setType({ type: 'Toggle', state: false });
                });
              }
              else
              {
                autoLaunchEntry.enable().then(() =>
                {
                  toggle.setType({ type: 'Toggle', state: true });
                });
              }
            };
          });
      }
    });
}

function loadShowHideKey()
{
  const showHideKeyCard = createCard();

  const showHideAccelerator = localStorage.getItem('showHideKey');
  
  if (!showHideAccelerator)
  {
    showChangeKeyCard(
      showHideKeyCard,
      'Hello there, ',
      'It looks like it\'s your first time using Sulaiman, Start by choosing a shortcut for summoning the application anytime you need it.',
      'showHideKey',
      showHide,
      () => autoHide = true
    );

    appendCard(showHideKeyCard);

    skipTaskbar(false);
  }
  else if (remote.globalShortcut.isRegistered(showHideAccelerator))
  {
    showChangeKeyCard(
      showHideKeyCard,
      'Sorry, It looks like',
      'A different application is using the shortcut you selected for summoning Sulaiman; we recommend to setting a new one.',
      'showHideKey',
      showHide,
      () => autoHide = true
    );

    appendCard(showHideKeyCard);

    skipTaskbar(false);
  }
  else
  {
    remote.globalShortcut.register(showHideAccelerator, showHide);

    autoHide = true;
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
* @param { () => void ) } [callback]
*/
function showChangeKeyCard(card, title, description, key, callback, done)
{
  card.auto({ title: title, description: description });

  captureKey(card, (accelerator) =>
  {
    unregisterGlobalShortcut(localStorage.getItem(key));

    localStorage.setItem(key, accelerator);
    
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
  });
}

/** make the card apply to capture key downs and turns them to accelerators
* @param { Card } card
* @param { (accelerator: Electron.Accelerator) => void } callback
*/
function captureKey(card, callback)
{
  const keys = [];

  const keysElem = card.appendText('', { size: 'Big', style: 'Bold' });

  const emptySpace = card.appendLineBreak();
  emptySpace.style.padding = '2px';

  const setButtonCard = createCard();
  const setButton = setButtonCard.appendText('Set', { align: 'Center' });
  setButtonCard.setType({ type: 'Button' });
  card.appendChild(setButtonCard);

  const cancelButtonCard = createCard();
  cancelButtonCard.appendText('Cancel', { align: 'Center' });
  cancelButtonCard.setType({ type: 'Button' });
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

    if (keys.length > 1 && checkGlobalShortcut(keys.join('+')))
      setButtonCard.setType({ type: 'Button' });
    else
      setButtonCard.setType({ type: 'Disabled' });
  };

  const cancelKeyCapture = () =>
  {
    keysElem.style.display = 'none';
    cancelButtonCard.domElement.style.display = 'none';

    setButton.innerText = 'Set';

    setButtonCard.domElement.onclick = startKeyCapture;
    setButtonCard.setType({ type: 'Button' });

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

    setButtonCard.setType({ type: 'Disabled' });

    window.addEventListener('keydown', keyCapture);
  };

  setButtonCard.domElement.onclick = startKeyCapture;
  cancelButtonCard.domElement.onclick = cancelKeyCapture;
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

        remote.app.quit();
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

  /** @type { { build: string, commit: string, date: string, package: string }  }
  */
  const localBuild = JSON.parse(readFileSync(join(__dirname, '../../build.json')).toString());

  if (!localBuild.package)
    return;

  request(
    'https://gitlab.com/herpproject/Sulaiman/-/jobs/artifacts/release/raw/build.json?job=build', {  json: true })
    .then((serverBuild) => check(serverBuild));
}