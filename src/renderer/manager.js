import { remote } from 'electron';

import { remove, removeSync, move, readFile, existsSync } from 'fs-extra';
import { join, basename } from 'path';
import { tmpdir } from 'os';

import request from 'request-promise-native';
import inly from 'inly';

import { makeItCollapsible, toggleCollapse } from './renderer.js';
import { appendCard, removeCard } from './api.js';

import { internalRegisterPhrase as registerPhrase } from './search.js';
import { internalCreateCard as createCard } from './card.js';
import { loadedExtensions } from './loader.js';

/** @typedef { import('./card.js').default } Card
*/

/** @typedef { import('./loader.js').PackageData } PackageData
*/

const npm = require('npm');

const { mainWindow, isDebug, reload } = remote.require(join(__dirname, '../main/window.js'));

/** @type {{ download: (win: Electron.BrowserWindow, url: string, options: { saveAs: boolean, directory: string, filename: string, openFolderWhenDone: boolean, showBadge: boolean, onStarted: (item: Electron.DownloadItem) => void, onProgress: (percentage: number) => void, onCancel: () => void }) => Promise<Electron.DownloadItem> }}
*/
const { download: dl  } = remote.require('electron-dl');

let cancelToken;

export function loadNPM()
{
  npm.load((err) =>
  {
    if (err)
      throw err;
  });
}

export function registerExtensionsPhrase()
{
  // since this function is called once when the app starts
  // it's safe to call a check for updates here
  if (!isDebug())
  {
    const updatesCard = createCard();

    checkForExtensionsUpdates(updatesCard).then((number) =>
    {
      if (number > 0)
        appendCard(updatesCard);
    });
  }

  return new Promise((resolve) =>
  {
    const extensionsPhrase = registerPhrase('Extensions', [ 'Install', 'Running', 'Check for Updates' ], (phrase, argument, extra) =>
    {
      const card = phrase.card;

      card.reset();

      if (argument === 'Install')
      {
        if (cancelToken)
        {
          cancelToken();
          cancelToken = undefined;
        }
        
        cancelToken = extensionInstallCard(card, extra, phrase);
      }
      else if (argument === 'Running')
      {
        showRunningExtensions(card);
      }
      else if (argument === 'Check for Updates')
      {
        checkForExtensionsUpdates(card);
      }
    });

    Promise.all([ extensionsPhrase ]).then(resolve);
  });
}

/** @param { Card } parent
*/
function checkForExtensionsUpdates(parent)
{
  return new Promise((resolve, reject) =>
  {
    let number = 0;
    const promises = [];
  
    parent.auto({ title: 'Extensions', description: 'Checking for Updates' });
      
    for (const extension in loadedExtensions)
    {
      const local = loadedExtensions[extension];
  
      promises.push(getPackageData(local.name)
        .then((remote) =>
        {
          if (local.version !== remote.version)
          {
            const card = createCard();
  
            if (extensionUpdateCard(card, local, remote, remote.name))
            {
              toggleCollapse(card, undefined, true);
  
              appendCard(card);
  
              number += 1;
            }
          }
        }).catch((err) => reject(err)));
    }
  
    Promise.all(promises).then(() =>
    {
      parent.auto({ title: number + ' Extensions have Updates', description: '' });

      if (number > 0)
        makeItCollapsible(parent);

      resolve(number);
    });
  });
}

/** @param { Card } parent
*/
function showRunningExtensions(parent)
{
  parent.auto({ title: 'Running Extensions' });

  makeItCollapsible(parent);
  
  for (const extension in loadedExtensions)
  {
    const card = createCard();

    extensionDeleteCard(card, loadedExtensions[extension]);

    toggleCollapse(card, undefined, true);
  
    parent.appendChild(card);
  }
}

/** @param { Card } card
* @param { PackageData } extension
*/
function extensionDeleteCard(card, extension)
{
  const button = extensionCard(card, extension);

  button.auto({ title: 'Delete' });

  button.domElement.onclick = () =>
  {
    button.auto({ title: 'Deleting' });
    button.setType({ type: 'Normal' });
  
    deleteDir(extension.name)
      .then(() =>
      {
        success(button);
      })
      .catch(() =>
      {
        reload();
      });
  };
}

/** @param { Card } card
* @param { string } name
*/
function extensionInstallCard(card, name)
{
  if (!name)
  {
    card.auto({ title: 'Extensions', description: 'Enter extension name' });
    return;
  }

  card.auto({ title: name, description: 'Gathering information from the internet...' });

  const cancelPromise = cancelablePromise(getPackageData(name));

  cancelPromise.promise
    .then((data) =>
    {
      data.sulaiman = {};

      // const validated = validateExtension(data);

      // if (validated)
      //   throw validated;

      const button = extensionCard(card, data);
    
      button.auto({ title: 'Install' });

      button.domElement.onclick = () =>
      {
        downloadExtension(card, button, data.name, data.dist.tarball)
          .then(() =>
          {
            return installExtensionDependencies(button, data.name);
          })
          .then(() =>
          {
            success(button);
          })
          .catch((err) =>
          {
            failedToInstall(card, name, err.message);
          });
      };
    })
    .catch((err) =>
    {
      if (err && err.canceled)
        return;
      
      failedToInstall(card, name, err.message);
    });

  return cancelPromise.cancel;
}

/** @param { Card } card
* @param { PackageData } local
* @param { PackageData } remote
* @param { string } name
*/
function extensionUpdateCard(card, local, remote, name)
{
  if (validateExtension(remote))
    return false;

  const updateButton = extensionCard(card, remote, local);

  updateButton.auto({ title: 'Update' });

  const dismissButton = createCard();
  dismissButton.setType({ type: 'Button' });

  dismissButton.auto({ title: 'Dismiss' });
  
  card.appendChild(dismissButton);

  updateButton.domElement.onclick = () =>
  {
    card.removeChild(dismissButton);

    downloadExtension(card, updateButton, remote.name, remote.dist.tarball)
      .then(() =>
      {
        return installExtensionDependencies(updateButton, remote.name);
      })
      .then(() =>
      {
        success(updateButton);
      })
      .catch((err) =>
      {
        failedToInstall(card, name, err.message);
      });
  };

  dismissButton.domElement.onclick = () => removeCard(card);

  return true;
}

/** @param { string } name
* @return { Promise<PackageData> }
*/
function getPackageData(name)
{
  return new Promise((resolve, reject) =>
  {
    request('https://registry.npmjs.org/'+ name + '/latest', { json: true })
      .then((value) =>
      {
        resolve(value);
      })
      .catch((err) =>
      {
        reject(err);
      });
  });
}

/** @param { Card } card
* @param { PackageData } data
* @param { PackageData } oldData
* @returns { Card }
*/
function extensionCard(card, data, oldData)
{
  card.auto({
    title: data.sulaiman.displayName,
    description: data.description
  });

  card.setType({ type: 'Normal' });

  makeItCollapsible(card);

  let permissions, modules;

  if (data.sulaiman.permissions)
  {
    permissions = data.sulaiman.permissions;

    if (oldData && oldData.sulaiman.permissions)
      permissions = data.sulaiman.permissions.filter(x => !oldData.sulaiman.permissions.includes(x));

    permissions = permissions.join('\n');
  }

  if (data.sulaiman.modules)
  {
    modules = data.sulaiman.modules;

    if (oldData && oldData.sulaiman.modules)
      modules = data.sulaiman.modules.filter(x => !oldData.sulaiman.modules.includes(x));

    modules = modules.join('\n');
  }

  const showPermissions = permissions && permissions.length > 0;
  const showModules = modules && modules.length > 0;

  if (showPermissions || showModules)
    card.appendLineBreak();

  if (showPermissions)
  {
    card.appendText(((oldData) ? 'ADDED ' : '') + 'PERMISSIONS', { size: 'Smaller', style: 'Bold' });
    card.appendText(permissions, { type: 'Description', size: 'Smaller' });
  }
  
  if (showModules)
  {
    card.appendText(((oldData) ? 'ADDED ' : '') + 'MODULES', { size: 'Smaller', style: 'Bold' });
    card.appendText(modules, { type: 'Description', size: 'Smaller' });
  }

  const button = createCard();

  button.setType({ type: 'Button' });
  
  card.appendChild(button);
  
  return button;
}

/** @param { string } name
*/
function deleteDir(name)
{
  return remove(join(__dirname, '../extensions/' + name));
}

/** @param { PackageData } data
*/
function validateExtension(data)
{
  if (!data.sulaiman)
    return new Error('is not a Sulaiman Extension');

  if (!data.sulaiman.displayName)
    return new Error('Package information misconfiguration, display name is not defined');

  if (data.sulaiman.platform && !data.sulaiman.platform.includes(process.platform.toString()))
    return new Error('This platform is not supported by the extension');

  return undefined;
}

/** @template T
* @param { Promise<T> } promise
* @returns { { promise: Promise<T>, cancel: () => void } }
*/
function cancelablePromise(promise)
{
  let cancel;

  const cancelPromise = new Promise((resolve, reject) =>
  {
    cancel = reject.bind(null, { canceled: true });
  });

  const cancelablePromise = Object.assign(Promise.race([ promise, cancelPromise ]), { cancel });

  return { promise: cancelablePromise, cancel };
}

/** @param { Card } card
* @param { Card } button
* @param { string } name
* @param { string } url
* @returns { Promise<void> }
*/
function downloadExtension(card, button, name, url)
{
  return new Promise((resolve, reject) =>
  {
    const filename = basename(url);
    const dirname = name;
  
    const tmpDir = join(tmpdir(), 'sulaiman', dirname);

    if (existsSync(tmpDir))
      removeSync(tmpDir);
  
    const tmpCompressedDir = join(tmpdir(), filename);
  
    const output = join(__dirname, '../extensions/' + dirname);

    button.setType({ type: 'Normal' });

    dl(mainWindow, url,
      {
        directory: tmpdir(),
        filename: filename,
        showBadge: false,
        onProgress: (percentage) =>
        {
          percentage = Math.floor(percentage * 100);

          button.auto({ title: 'Downloading ' + percentage + '%' });
          
          card.setType({ type: 'ProgressBar', percentage: percentage });
        }
      })
      .then(() =>
      {
        const extract = inly(tmpCompressedDir, tmpDir);
  
        extract.on('progress', (percentage) =>
        {
          button.auto({ title: 'Decompressing ' + percentage + '%' });
          
          card.setType({ type: 'ProgressBar', percentage: percentage });
        });
  
        extract.on('error', (err) =>
        {
          reject(err);
        });
  
        extract.on('end', () =>
        {
          card.setType({ type: 'Normal' });

          move(tmpDir + '/package', output, { overwrite: true }).then(resolve);
        });
      })
      .catch((err) =>
      {
        reject(err.cause || err);
      });
  });
}

/** @param { Card } button
* @param { string } name
* @returns { Promise<void> }
*/
function installExtensionDependencies(button, name)
{
  return new Promise((resolve, reject) =>
  {
    button.auto({ title: 'Installing Dependencies' });

    const dir = join(__dirname, '../extensions/' + name);

    const orgPrefix = npm.prefix;
  
    npm.prefix = dir;

    readFile(join(dir, '/package.json'))
      .then((file) =>
      {
        const data = JSON.parse(file.toString());
  
        const dependencies = [];
  
        for (const mod in data.dependencies)
        {
          dependencies.push(mod + '@' + data.dependencies[mod]);
        }
  
        npm.commands.install(dependencies, (err) =>
        {
          npm.prefix = orgPrefix;

          if (err)
          {
            reject(err);
            
            return;
          }

          resolve();
        });
      })
      .catch((err) =>
      {
        reject(err);
      });
  });
}

/** @param { Card } button
*/
function success(button)
{
  button.auto({ title: 'Reload' });
  button.setType({ type: 'Button' });
  
  button.domElement.onclick = () => reload();
}

/** @param { Card } card
/** @param { string } name
/** @param { string } err
*/
function failedToInstall(card, name, err)
{
  deleteDir(name).then(() =>
  {
    card.reset();
    card.auto({ title: name, description: err });

    const button = createCard({ title: 'Try Again' });
    button.setType({ type: 'Button' });
  
    card.appendChild(button);
    
    button.domElement.onclick = () =>
    {
      extensionInstallCard(card, name);
    };
  });
}