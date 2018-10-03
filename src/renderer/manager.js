import { remote } from 'electron';

import { tmpdir, platform } from 'os';

import { join, basename } from 'path';
import { remove, removeSync, move, readFile, existsSync } from 'fs-extra';

import request from 'request-promise-native';
import inly from 'inly';

import { makeItCollapsible, toggleCollapse } from './renderer.js';
import { appendCard, removeCard } from './api.js';

import { internalRegisterPhrase as registerPhrase } from './search.js';
import { internalCreateCard as createCard } from './card.js';
import { loadedExtensions, getPlatform, themeName } from './loader.js';

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
    const extensionsPhrase = registerPhrase('Extensions', [ 'Install', 'Running', 'Check for Updates' ], undefined, (phrase, match, argument, extra) =>
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

/** @param { Card } card
* @param { PackageData } data
* @param { PackageData } oldData
* @returns { Card }
*/
export function extensionCard(card, data, oldData)
{
  card.reset();

  card.auto({
    title: data.sulaiman.displayName,
    description: data.description
  });
  
  card.setType({ type: 'Normal' });

  makeItCollapsible(card);
  
  card.appendLineBreak();

  card.appendText('Package', { size: 'Smaller', style: 'Bold' });
  card.appendText(data.name + '@' + data.version, { type: 'Description', size: 'Smaller' });

  let permissions, modules;

  // get the names of all permissions, and filters already accepted permissions
  if (data.sulaiman.permissions)
  {
    permissions = data.sulaiman.permissions;

    if (oldData && oldData.sulaiman.permissions)
      permissions = data.sulaiman.permissions.filter(x => !oldData.sulaiman.permissions.includes(x));

    permissions = permissions.join('\n');
  }

  // get the names of all modules, and filters already accepted modules
  if (data.sulaiman.modules)
  {
    modules = data.sulaiman.modules;

    if (oldData && oldData.sulaiman.modules)
      modules = data.sulaiman.modules.filter(x => !oldData.sulaiman.modules.includes(x));

    modules = modules.join('\n');
  }

  const showPermissions = permissions && permissions.length > 0;
  const showModules = modules && modules.length > 0;

  if (showPermissions)
  {
    card.appendText(((oldData) ? 'New ' : '') + 'Permissions', { size: 'Smaller', style: 'Bold' });
    card.appendText(permissions, { type: 'Description', size: 'Smaller' });
  }
  
  if (showModules)
  {
    card.appendText(((oldData) ? 'New ' : '') + 'Modules', { size: 'Smaller', style: 'Bold' });
    card.appendText(modules, { type: 'Description', size: 'Smaller' });
  }

  const button = createCard();

  button.setType({ type: 'Button' });
  
  card.appendChild(button);
  
  return button;
}

/** @param { Card } card
* @param { PackageData } extension
*/
export function extensionDeleteCard(card, extension)
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
        success(card, extension.sulaiman.displayName, 'deleted');
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
export function extensionInstallCard(card, name)
{
  if (!name)
  {
    card.auto({ title: 'Extensions', description: 'Enter a npm package name' });

    return;
  }

  if (name.split(' ').length > 1)
  {
    card.auto({ title: 'Extensions', description: 'Invalid package name' });

    return;
  }

  if (!name.startsWith('sulaiman-'))
    name = 'sulaiman-' + name;

  card.auto({ title: name, description: 'Requesting package information from the npm registry' });

  const cancelPromise = cancelablePromise(getPackageData(name));

  cancelPromise.promise
    .then((data) =>
    {
      function show()
      {
        const button = extensionCard(card, data);
    
        button.auto({ title: 'Install' });
  
        button.domElement.onclick = () =>
        {
          downloadExtension(card, button, data.name, data.dist.tarball)
            .then(({ packageDir, output }) =>
            {
              if (validated.beforeMoving)
              {
                button.auto({ title: validated.beforeMovingMessage });
      
                return validated.beforeMoving().then(() =>
                {
                  return { packageDir, output };
                });
              }
              else
              {
                return { packageDir, output };
              }
            })
            .then(({ packageDir, output }) =>
            {
              button.auto({ title: 'Moving package files to extensions folder' });
                  
              return move(packageDir, output, { overwrite: true });
            })
            .then(() =>
            {
              // return installExtensionDependencies(button, data.name);
            })
            .then(() =>
            {
              success(card, data.sulaiman.displayName, 'installed');
            })
            .catch((err) =>
            {
              failedToInstall(card, name, err.message);
            });
        };
      }

      const validated = validateExtension(card, data);

      if (validated.fail === true)
        return;

      if (validated.beforeMoving)
      {
        card.reset();

        card.auto({ description: data.sulaiman.displayName });
        card.appendText(validated.continueMessage, { style: 'Bold', size: 'Small' });
        card.appendLineBreak();
        
        const button = createCard({ title: 'Continue' });
        button.setType({ type: 'Button' });

        card.appendChild(button);

        button.domElement.onclick = show;
      }
      else
      {
        show();
      }
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
export function extensionUpdateCard(card, local, remote, name)
{
  function show()
  {
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
        .then(({ packageDir, output }) =>
        {
          if (validated.beforeMoving)
          {
            updateButton.auto({ title: validated.beforeMovingMessage });
  
            return validated.beforeMoving().then(() =>
            {
              return { packageDir, output };
            });
          }
          else
          {
            return { packageDir, output };
          }
        })
        .then(({ packageDir, output }) =>
        {
          updateButton.auto({ title: 'Moving package files to extensions folder' });
        
          return move(packageDir, output, { overwrite: true });
        })
        .then(() =>
        {
          return installExtensionDependencies(updateButton, remote.name);
        })
        .then(() =>
        {
          success(card, remote.sulaiman.displayName, 'installed');
        })
        .catch((err) =>
        {
          failedToInstall(card, name, err.message);
        });
    };
  
    dismissButton.domElement.onclick = () => removeCard(card);
  }

  const validated = validateExtension(card, remote, true);

  if (validated.fail === true)
    return false;

  if (validated.beforeMoving)
  {
    card.reset();

    card.auto({ description: remote.sulaiman.displayName });
    card.appendText(validated.continueMessage, { style: 'Bold', size: 'Small' });
    card.appendLineBreak();
    
    const continueButton = createCard({ title: 'Continue' });
    const dismissButton = createCard();

    continueButton.setType({ type: 'Button' });
    dismissButton.setType({ type: 'Button' });

    card.appendChild(continueButton);
    card.appendChild(dismissButton);

    continueButton.domElement.onclick = show;
    dismissButton.domElement.onclick = () => removeCard(card);
  }
  else
  {
    show();
  }

  return true;
}

/** @param { Card } card
* @param { PackageData } data
* @param { boolean } update
* @returns { { fail: boolean, continueMessage: string, beforeMovingMessage: string, beforeMoving: () => Promise<void> } }
*/
function validateExtension(card, data, update)
{
  if (!data.sulaiman)
  {
    card.auto({ description: 'This package is not a sulaiman extension' });

    return { fail: true };
  }
  
  if (!data.sulaiman.displayName)
    data.sulaiman.displayName = data.name;

  // incompatible platform
  if (data.sulaiman.platform && !data.sulaiman.platform.includes(platform()))
  {
    card.auto({ description: getPlatform() + ' is not supported by the this extension' });

    return { fail: true };
  }

  // already loaded with the same name, and not an update
  if (!update && loadedExtensions[data.name])
  {
    return {
      continueMessage: 'Installing this extension will override a already installed extension with the same package name',
      beforeMovingMessage: 'Deleting extension with the same name',
      beforeMoving: () =>
      {
        return deleteDir(data.name);
      }
    };
  }

  // handle conflicting themes (more than one extension want theme permissions)
  if (themeName !== data.name)
  {
    return {
      continueMessage: 'Installing this extension will delete your current theme: ' + loadedExtensions[themeName].sulaiman.displayName,
      beforeMovingMessage: 'Deleting the extension current theme extension',
      beforeMoving: () =>
      {
        return deleteDir(themeName);
      }
    };
  }

  return {};
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
              toggleCollapse(card, undefined, true, true);
  
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

    toggleCollapse(card, undefined, true, true);
  
    parent.appendChild(card);
  }
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

/** @param { string } name
*/
function deleteDir(name)
{
  return remove(join(__dirname, '../extensions/' + name));
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
* @returns { Promise<{ packageDir: string, output: string }> }
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

    dl(mainWindow, url,
      {
        directory: tmpdir(),
        filename: filename,
        showBadge: false,
        onStarted: () =>
        {
          button.setType({ type: 'Normal' });
        },
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

          resolve({ packageDir: tmpDir + '/package', output: output });
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

/** @param { Card } card
* @param { string } name
* @param { string } state
*/
function success(card, name, state)
{
  card.reset();
  card.auto({ title: name, description: 'Has been ' + state });

  const button = createCard({ title: 'Reload' });
  button.setType({ type: 'Button' });

  card.appendChild(button);
  
  button.domElement.onclick = () => reload();
}

/** @param { Card } card
* @param { string } name
* @param { string } err
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

      card.removeChild(button);
    };
  });
}