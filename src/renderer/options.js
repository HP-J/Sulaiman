import { remote } from 'electron';

import { tmpdir } from 'os';
import { join } from 'path';

import { readFileSync, existsSync, pathExists } from 'fs-extra';

import AutoLaunch from 'auto-launch';
import request from 'request-promise-native';

import * as settings from '../settings.js';
import download from '../dl.js';

import { internalRegisterPhrase as registerPhrase } from './search.js';
import { internalCreateCard as createCard } from './card.js';

import { appendCard, removeCard, containsCard } from './api.js';
import { on } from './loader.js';

/** @typedef { import('./card.js').default } Card
*/

/** @typedef { import('./loader').PackageData } PackageData
*/

/** @typedef { Object } BuildData
* @property { string } branch
* @property { string } commit
* @property { string } pipeline
* @property { string } date
* @property { string } package
*/

const { isDebug, showHide, setSkipTaskbar } = remote.require(join(__dirname, '../main/window.js'));

const autoLaunchEntry = new AutoLaunch({ name: 'Sulaiman', isHidden: true });

/** @type { Card }
*/
let autoUpdateCheckCard;

let userManuallyCheckedOnce = false;

export let autoHide = false;

/** @type { PackageData }
*/
export let packageData;

/** @type { BuildData }
*/
export let localData;

/** @type { string }
*/
export let changeLog;

/** the current sulaiman api version
* @type { string }
*/
export let apiVersion;

export function loadOptions()
{
  packageData = readJson(join(__dirname, '../../package.json'));
  localData = readJson(join(__dirname, '../../build.json'));

  changeLog = readFile(join(__dirname, '../../CHANGELOG.md'));

  if (packageData)
    apiVersion = packageData.version;

  autoUpdateCheckCard = createCard();

  if (isDebug())
    return;
  
  loadAutoLaunch();
  loadShowHideKey();

  checkForUpdates(autoUpdateCheckCard, true);
}

export function registerOptionsPhrase()
{
  return new Promise((resolve) =>
  {
    const optionsPhrase = registerPhrase('Options', [ 'Shortcuts', 'Auto-Launch', 'Tray' ], {
      activate: (card, suggestion, match, argument) =>
      {
        card.reset();

        if (argument === 'Shortcuts')
        {
          showChangeKeyCard(card, 'Show/Hide', '', 'showHideKey', showHide,
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
          card.auto({ description: 'Loading Current Settings' });

          autoLaunchEntry.isEnabled()
            .then((state) =>
            {
              card.auto({ description: '' });

              const toggle = createCard();

              card.appendChild(toggle);
    
              toggle.setType({
                type: 'Toggle',
                title: 'Auto-Launch',
                defaultState: state,
                callback: (state) =>
                {
                  card.setType({ type: 'Disabled' });

                  if (state)
                    autoLaunchEntry.enable().then(() => card.setType({ type: 'Normal' }));
                  else
                    autoLaunchEntry.disable().then(() => card.setType({ type: 'Normal' }));
                }
              });
            });
        }
        else if (argument === 'Tray')
        {
          card.auto();

          const state = settings.get('trayIcon', true);
          const color = settings.get('trayIconColor', 'light');

          // add a warning that the changes are applied after the app is restarted
          card.appendText('Changes are applied after the app is restarted', { style: 'Bold', size: 'Smaller', align: 'Right' });

          // Tray Icon Toggle
          
          card.appendLineBreak();

          const toggle = createCard();

          card.appendChild(toggle);

          toggle.setType({
            type: 'Toggle',
            title: 'Tray',
            defaultState: state,
            callback: (state) => settings.set('trayIcon', state)
          });

          // Tray Icon Colors

          card.appendLineBreak();

          card.appendText('Tray Color');
          
          const picks = createCard();

          const picksArray =  [ 'Dark', 'Black', 'Light' ];

          card.appendChild(picks);

          picks.setType({
            type: 'Picks',
            picks: picksArray,
            defaultPickIndex: picksArray.findIndex((value) => value.toLowerCase() === color),
            callback: (pick) => settings.set('trayIconColor', pick.toLowerCase())
          });
        }
      }
    });

    const aboutArgs = [ 'About', 'Check for Updates' ];

    if (changeLog)
      aboutArgs.push('Changelog');

    const aboutPhrase = registerPhrase('Sulaiman', aboutArgs, {
      activate: (card, suggestion, match, argument) =>
      {
        card.reset();

        if (argument === 'About')
        {
          card.auto({ title: 'About Sulaiman' });

          if (localData)
          {
            if (localData.branch)
              card.appendText('Branch: ' + localData.branch, { type: 'Description', select: 'Selectable' });

            if (localData.commit)
              card.appendText('Commit: ' + localData.commit, { type: 'Description', select: 'Selectable' });

            if (localData.pipeline)
              card.appendText('Pipeline: ' + localData.pipeline, { type: 'Description', select: 'Selectable' });
              
            if (localData.package)
              card.appendText('Package: ' + localData.package, { type: 'Description', select: 'Selectable' });

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
        }
        else if (argument === 'Check for Updates')
        {
          // if the auto check card is shown
          // then don't show this one
          if (containsCard(autoUpdateCheckCard))
            return false;
          
          userManuallyCheckedOnce = true;

          checkForUpdates(card);
        }
        else if (argument === 'Changelog')
        {
          card.auto({ title: 'Sulaiman Changelog' });

          card.appendText(changeLog, {
            type: 'Description',
            'select': 'Selectable',
            size: 'Small'
          });
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
    on.ready(() =>
    {
      showChangeKeyCard(
        showHideKeyCard,
        'Hello',
        'It looks like it\'s your first time using Sulaiman, Start by choosing a shortcut for summoning the application anytime you need it.',
        'showHideKey', showHide,
        () =>
        {
          autoHide = true;
  
          setSkipTaskbar(true);
        }
      );
  
      appendCard(showHideKeyCard);
    });
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

      on.ready(() =>
      {
        autoLaunchCard.appendText('Sulaiman can auto launch itself on startup, would you want that?', { type: 'Description' });

        const yesButton = createCard();

        yesButton.setType({
          type: 'Button',
          title: 'Yes',
          callback: () =>
          {
            autoLaunchEntry.enable();
    
            removeCard(autoLaunchCard);
          }
        });

        autoLaunchCard.appendChild(yesButton);
  
        const dismissButton = createCard();

        dismissButton.setType({
          type: 'Button',
          title: 'Dismiss',
          callback: () =>
          {
            settings.set('ignoreAutoLaunch', true);
    
            removeCard(autoLaunchCard);
          }
        });

        autoLaunchCard.appendChild(dismissButton);
  
        appendCard(autoLaunchCard);
      });
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

/** @param { string } filename
* @returns { Object }
*/
function readJson(filename)
{
  if (existsSync(filename))
    return JSON.parse(readFileSync(filename, { encoding: 'utf8' }));
}

/** @param { string } filename
* @returns { Object }
*/
function readFile(filename)
{
  if (existsSync(filename))
    return readFileSync(filename, { encoding: 'utf8' });
}

/** Checks for updates using the remote's build json and updates a card ui
* @param { Card } card
* @param { boolean } autoCheck
*/
function checkForUpdates(card, autoCheck)
{
  card.auto({ title: 'Sulaiman', description: 'Checking for updates' });
  card.setType({ type: 'LoadingBar' });

  localData = {};
  localData.branch = 'release';
  localData.commit = 'a';
  localData.package = 'nsis';

  // if build.json doesn't exists or if the package is not specified
  if (!localData || !localData.branch || !localData.commit || !localData.package)
  {
    card.auto({ description: 'build.json file is misconfigured or missing' });

    card.setType({ type: 'Normal' });

    return;
  }

  // request the server's build.json
  request('https://gitlab.com/herpproject/Sulaiman/-/jobs/artifacts/' + localData.branch + '/raw/build.json?job=build', {  json: true })
    .then((remoteData) =>
    {
      // if commit id is different, and there's an available package for this platform
      if (remoteData.commit !== localData.commit)
      {
        if (remoteData[localData.package])
        {
          updateFound(card, remoteData[localData.package], remoteData.commit, autoCheck);
        }
        else
        {
          card.auto({ description: 'An update exists but is not available for your package' });

          card.setType({ type: 'Normal' });
        }
      }
      else
      {
        card.auto({ description: 'Up-to-date' });

        card.setType({ type: 'Normal' });
      }
    }).catch(() => updateError(card));
}

/** @param { Card } card
*/
function updateError(card)
{
  card.auto({ description: 'Failed to check for updates' });

  card.setType({ type: 'Normal' });
}

/** @param { Card } card
* @param { string } url
* @param { string } commitID
* @param { boolean } autoCheck
*/
function updateFound(card, url, commitID, autoCheck)
{
  card.auto({ description: 'Update Available' });
  card.setType({ type: 'Normal' });

  card.updateButton = createCard({ title: 'Download' });
  card.dismissButton = createCard({ title: 'Dismiss' });

  card.updateButton.setType({ type: 'Button' });
  card.dismissButton.setType({ type: 'Button' });

  card.updateButton.domElement.onclick = () => updateDownload(card, url, commitID, autoCheck);
  card.dismissButton.domElement.onclick = () => updateDismiss(card);

  card.appendChild(card.updateButton);

  if (autoCheck && !userManuallyCheckedOnce)
  {
    card.appendChild(card.dismissButton);

    appendCard(card);
  }
}

/** @param { Card } card
*/
function updateDismiss(card)
{
  removeCard(card);
}

/** @param { Card } card
* @param { Card } card
* @param { number } current
* @param { number } total
*/
function updateProgress(card, current, total)
{
  const percentage = ((current / total) * 100).toFixed(1);

  card.auto({ description: `Downloading ${percentage}%` });
  card.setType({ type: 'ProgressBar', percentage: percentage });
}

/** @param { Card } card
* @param { boolean } autoCheck
* @param { () => void } abort
*/
function updateCanceled(card, autoCheck, abort)
{
  card.auto({ description: 'The update was canceled' });
  card.setType({ type: 'Normal' });

  // abort the download process
  abort();

  // remove the buttons
  card.removeChild(card.updateButton);
  card.removeChild(card.dismissButton);

  // update the dismiss to dismiss the card
  if (autoCheck)
  {
    card.dismissButton.auto({ title: 'Dismiss' });
    card.dismissButton.domElement.onclick = () => updateDismiss(card);
  
    card.appendChild(card.dismissButton);
  }
}

/** @param { Card } card
* @param { string } path
* @param { boolean } autoCheck
*/
function updateDownloaded(card, path, autoCheck)
{
  card.auto({ description: 'The update was downloaded\nYou have to install it manually' });
  card.setType({ type: 'Normal' });

  // remove the buttons
  card.removeChild(card.updateButton);
  card.removeChild(card.dismissButton);

  // update the button to open the downloaded file
  card.updateButton.auto({ title: 'Install' });
  card.updateButton.domElement.onclick = () => remote.shell.openItem(path);
  
  card.appendChild(card.updateButton);

  if (autoCheck)
  {
    card.dismissButton.auto({ title: 'Dismiss' });
    card.dismissButton.domElement.onclick = () => updateDismiss(card);
  
    card.appendChild(card.dismissButton);
  }
}

/** @param { Card } card
* @param { string } url
* @param { string } commitID
* @param { boolean } autoCheck
*/
function updateDownload(card, url, commitID, autoCheck)
{
  card.auto({ description: 'Starting Download' });
  card.setType({ type: 'LoadingBar' });

  // remove the buttons
  card.removeChild(card.updateButton);
  card.removeChild(card.dismissButton);

  url = new URL(url);

  const filename = `tmp-sulaiman-update-${commitID}`;
  const fullPath = join(tmpdir(), filename);

  // if the update file was already downloaded
  pathExists(fullPath).then((exists) =>
  {
    if (exists)
    {
      updateDownloaded(card, fullPath);
    }
    else
    {
      const dl = download(url.href, {
        dir: tmpdir(),
        filename: filename,
        onProgress: (current, total) => updateProgress(card, current, total),
        onError: () => updateError(card),
        onDone: () => updateDownloaded(card, fullPath, autoCheck)
      });

      // update the button to cancel, when pressed will abort the download
      card.dismissButton.auto({ title: 'Cancel' });
      card.dismissButton.domElement.onclick = () => updateCanceled(card, autoCheck, dl.abort);

      card.appendChild(card.dismissButton);
    }
  });
}
