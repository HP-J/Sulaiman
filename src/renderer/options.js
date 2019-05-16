import { remote } from 'electron';

import { tmpdir } from 'os';
import { join } from 'path';

import { readFileSync, existsSync, pathExists } from 'fs-extra';

import AutoLaunch from 'auto-launch';
import request from 'request-promise-native';

import * as settings from '../settings.js';
import download from '../dl.js';

import { createCard } from './card.js';
import { createPrefix } from './prefix.js';

import { appendCard, removeCard, containsCard } from './api.js';

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

const { reload, quit } = remote.require(join(__dirname, '../main/window.js'));

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
  
  loadShowHideKey();
  setupWalkthrough();

  checkForUpdates(autoUpdateCheckCard, true);
}

export function registerOptionsPrefix()
{
  // Options Prefix

  const optionsPrefix = createPrefix({
    prefix: 'options'
  });

  optionsPrefix.setFixedSuggestions([
    'Shortcuts',
    'Auto-Launch',
    'Tray'
  ]);

  optionsPrefix.on.activate((card, searchItem, extra, suggestion) =>
  {
    card.reset();

    if (suggestion === 'Shortcuts')
      showShowHideOptions(card);
    else if (suggestion === 'Auto-Launch')
      showAutoLaunchToggle(card);
    else if (suggestion === 'Tray')
      showTrayOptions(card);
  });

  optionsPrefix.register();

  // Sulaiman Prefix

  const sulaimanPrefix = createPrefix({
    prefix: 'sulaiman'
  });

  sulaimanPrefix.setFixedSuggestions([
    'About',
    'Check for Updates',
    'Reload',
    'Quit'
  ]);

  if (changeLog)
    sulaimanPrefix.addFixedSuggestions('Changelog');

  sulaimanPrefix.on.enter((searchItem, extra, suggestion) =>
  {
    if (suggestion === 'Reload')
      reload();
    else if (suggestion === 'Quit')
      quit();
  });

  sulaimanPrefix.on.activate((card, searchItem, extra, suggestion) =>
  {
    card.reset();

    if (suggestion === 'About')
    {
      card.auto({ title: 'About Sulaiman' });

      if (localData)
      {
        if (localData.branch)
          card.appendText('Branch: ' + localData.branch, { type: 'Description', select: 'Selectable' }, true);

        if (localData.commit)
          card.appendText('Commit: ' + localData.commit, { type: 'Description', select: 'Selectable' }, true);

        if (localData.pipeline)
          card.appendText('Pipeline: ' + localData.pipeline, { type: 'Description', select: 'Selectable' }, true);
          
        if (localData.package)
          card.appendText('Package: ' + localData.package, { type: 'Description', select: 'Selectable' }, true);

        if (localData.date)
          card.appendText('Release Date: ' + localData.date, { type: 'Description', select: 'Selectable' }, true);
      }

      if (packageData)
      {
        if (packageData.version)
          card.appendText('API: ' + packageData.version, { type: 'Description', select: 'Selectable' }, true);
      }

      if (process.versions.electron)
        card.appendText('Electron: ' + process.versions.electron, { type: 'Description', select: 'Selectable' }, true);

      if (process.versions.chrome)
        card.appendText('Chrome: ' + process.versions.chrome, { type: 'Description', select: 'Selectable' }, true);

      if (process.versions.node)
        card.appendText('Node.js: ' + process.versions.node, { type: 'Description', select: 'Selectable' }, true);

      if (process.versions.v8)
        card.appendText('V8: ' + process.versions.v8, { type: 'Description', select: 'Selectable' }, true);
    }
    else if (suggestion === 'Check for Updates')
    {
      // if the auto check card is shown
      // then don't show this one
      if (containsCard(autoUpdateCheckCard))
        return false;
      
      userManuallyCheckedOnce = true;

      checkForUpdates(card);
    }
    else if (suggestion === 'Changelog')
    {
      card.auto({ title: 'Sulaiman Changelog' });

      card.appendText(changeLog, {
        type: 'Description',
        'select': 'Selectable',
        size: 'Small'
      });
    }
  });

  sulaimanPrefix.register();
}

function setupWalkthrough()
{
  // settings.remove('firstTimer');

  const firstTimer = settings.get('firstTimer', false);

  // if the walkthrough was dismissed or finished before
  if (firstTimer)
    return;

  let pageIndex;

  const minPageIndex = 0;
  const  maxPageIndex = 2;

  // setup the walkthrough cards

  const walkthroughCard = createCard();
  const contentCard = createCard();

  const previousButton = createCard();
  const nextButton = createCard();

  previousButton.setType({
    type: 'Button',
    title: 'Previous',
    callback: () =>
    {
      pageIndex = pageIndex - 1;

      // minimal page index is 0
      // remove the previous button to the walkthrough card
      if (pageIndex <= minPageIndex)
        previousButton.toggleDisabled(true);

      // if the user went to a previous page after being in the last page
      // then change the button text to show that he can go forward again
      if (pageIndex < maxPageIndex)
        nextButtonText[0].innerText = 'Next';

      changeWalkthroughPage(contentCard, pageIndex);
    }
  });

  const nextButtonText = nextButton.setType({
    type: 'Button',
    title: 'Next',
    callback: () =>
    {
      pageIndex = pageIndex + 1;

      // shows that there are no more pages
      // if the user press again the card will be removed
      if (pageIndex === maxPageIndex)
        nextButtonText[0].innerText = 'Done';
      // the user pressed done
      else if (pageIndex > maxPageIndex)
      {
        removeCard(walkthroughCard);

        settings.set('firstTimer', true);
      }

      // append the previous button to the walkthrough card
      // if we're at any index above the minimal
      if (pageIndex > 0)
        previousButton.toggleDisabled(false);

      changeWalkthroughPage(contentCard, pageIndex);
    }
  });

  // append every card to where it should be

  walkthroughCard.appendChild(contentCard);

  walkthroughCard.appendLineBreak();

  walkthroughCard.appendChild(previousButton);
  walkthroughCard.appendChild(nextButton);

  // show the first page

  pageIndex = 0;
  
  previousButton.toggleDisabled(true);

  changeWalkthroughPage(contentCard, pageIndex);

  // add the walkthrough card to body
  appendCard(walkthroughCard);
}

/** @param { Card } card
*/
function changeWalkthroughPage(card, index)
{
  card.reset();

  // welcome the user
  // show the auto-launch prompt
  if (index === 0)
  {
    card.appendText('Welcome to Sulaiman', { type: 'Title' }, true);

    card.appendText('Together we\'ll walkthrough you through some quick settings to get you started.', { type: 'Description' }, true);
    card.appendText('Sulaiman can auto launch itself at startup, Would you want that?', { type: 'Description' }, true);

    showAutoLaunchToggle(card);
  }
  // show the Show/Hide shortcut prompt
  else if (index === 1)
  {
    card.appendText('Welcome to Sulaiman', { type: 'Title' }, true);

    card.appendText('You can set a key shortcut to show and hide Sulaiman any time you want', { type: 'Description' }, true);

    showShowHideOptions(card);
  }
  // show the user some of Sulaiman builtin prefixes
  else if (index === 2)
  {
    card.appendText('Welcome to Sulaiman', { type: 'Title' }, true);

    card.appendText('Sulaiman come with some builtin extensions to do basic stuff like 2+2 and launching system apps', { type: 'Description' }, true);
    card.appendText('We don\'t yet have a way to search for extensions inside the app', { type: 'Description' }, true);
    card.appendText('You can install more extensions by searching for them on NPM\'s website:', { type: 'Title' }, true);

    card.appendText('https://www.npmjs.com/', { type: 'Title', select: 'Link', style: 'Italic' }, true);

    card.appendText('Find the extension you want and download it and put it in Sulaiman\'s extensions folder', { type: 'Description' }, true);
    card.appendText('The next build of Sulaiman will have a more straightforward system in place for installing extensions and their dependencies', { type: 'Description' }, true);
  }
}

function loadShowHideKey()
{
  const showHideKeyCard = createCard();

  const showHideAccelerator = settings.get('showHideKey', undefined);

  if (showHideAccelerator && remote.globalShortcut.isRegistered(showHideAccelerator))
  {
    showChangeKeyCard(
      showHideKeyCard,
      'Sulaiman',
      'It looks like a different application is using the shortcut you selected for Show/Hide',
      'showHideKey', showHide,
      () =>
      {
        autoHide = true;
        setSkipTaskbar(true);

        removeCard(showHideKeyCard);
      },
      () =>
      {
        autoHide = false;
        setSkipTaskbar(false);

        removeCard(showHideKeyCard);
      }
    );

    appendCard(showHideKeyCard);
  }
  else if (showHideAccelerator)
  {
    remote.globalShortcut.register(showHideAccelerator, showHide);

    autoHide = true;
    setSkipTaskbar(true);
  }
}

/** @param { Card } card
*/
function showShowHideOptions(card)
{
  showChangeKeyCard(
    card,
    'Show/Hide:', '',
    'showHideKey', showHide,
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

/** @param { Card } card
*/
function showAutoLaunchToggle(card)
{
  const loadingElement = card.appendText('Loading Current State', { type: 'Description' });

  autoLaunchEntry.isEnabled()
    .then((state) =>
    {
      loadingElement.remove();

      const toggle = createCard();

      card.appendChild(toggle);

      toggle.setType({
        type: 'Toggle',
        title: 'Auto-Launch',
        defaultState: state,
        callback: (state) =>
        {
          card.toggleDisabled(true);

          if (state)
            autoLaunchEntry.enable().then(() => card.toggleDisabled(false));
          else
            autoLaunchEntry.disable().then(() => card.toggleDisabled(false));
        }
      });
    });
}

/** @param { Card } card
*/
function showTrayOptions(card)
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
  card.appendText(title, { type: 'Title' }, true);
  card.appendText(description, { type: 'Description' }, true);

  captureKey(
    card, key,
    (accelerator) =>
    {
      // if Sulaiman already had a shortcut with the same key
      unregisterGlobalShortcut(settings.get(key, undefined));

      // save the shortcut key, to register it the next time Sulaiman starts
      settings.set(key, accelerator);

      // register the shortcut key right now
      remote.globalShortcut.register(accelerator, callback);

      if (done)
        done();
    },
    () =>
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

  const keysElement = card.appendText('', { size: 'Big', style: 'Bold' }, true);

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

    keysElement.innerText = keys.join('+');

    if (keys.length > 1 && checkGlobalShortcut(keys.join('+')))
      setButtonCard.toggleDisabled(false);
    else
      setButtonCard.toggleDisabled(true);
  };

  const cancelKeyCapture = () =>
  {
    exists = settings.get(key);

    if (exists)
    {
      keysElement.innerText = exists;

      setButton.innerText = 'Change';
      cancelButton.innerText = 'Remove';
      
      cancelButtonCard.domElement.onclick = removeKey;
    }
    else
    {
      keysElement.style.display = 'none';

      cancelButtonCard.toggleHidden(true);
      
      setButton.innerText = 'Set';
      cancelButton.innerText = 'Cancel';
    }
    
    setButtonCard.domElement.onclick = startKeyCapture;

    window.removeEventListener('keydown', keyCapture);
  };

  const startKeyCapture = () =>
  {
    keysElement.style.cssText = '';

    cancelButtonCard.toggleHidden(false);
    setButtonCard.toggleDisabled(true);

    keysElement.innerText = 'Press The Keys';
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
      settings.remove(key);

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

  // if build.json doesn't exists or if the package is not specified
  if (!localData || !localData.branch || !localData.commit || !localData.package)
  {
    card.auto({ description: 'build.json file is misconfigured or missing' });

    card.setType({ type: 'Normal' });

    return;
  }

  // request the server's build.json
  request('https://gitlab.com/hpj/Sulaiman/-/jobs/artifacts/' + localData.branch + '/raw/build.json?job=build', {  json: true })
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
