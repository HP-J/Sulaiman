import { tmpdir } from 'os';

import * as api from './api.js';
import Card from './card.js';

import { PackageData, loadedExtensions } from './loader.js';
import { reload } from './renderer.js';

import { remove, move, readFile } from 'fs-extra';
import { join, basename } from 'path';

import request from 'request-promise-native';
import wget from 'node-wget-promise';
import inly from 'inly';

const npm = require('npm');

const cards = [];

export function loadNPM()
{
  npm.load((err) =>
  {
    if (err)
      throw err;
  });
}

export function checkForExtensionsUpdates()
{
  for (const extension in loadedExtensions)
  {
    const local = loadedExtensions[extension];

    getPackageData(local.name)
      .then((remote) =>
      {
        if (local.version !== remote.version)
        {
          const card = new Card();

          if (extensionUpdateCard(card, local, remote, remote.name))
          {
            card.enableFastForward();
            card.collapse();

            api.appendChild(card);
          }
        }
      });
  }
}

export function showInstalledExtensions()
{
  api.onSearchBarInput((value) =>
  {
    if (value === 'ext')
    {
      for (const extension in loadedExtensions)
      {
        const card = new Card();

        extensionDeleteCard(card, loadedExtensions[extension]);

        card.enableFastForward();
        card.collapse();
      
        api.appendChild(card);

        cards.push(card);
      }
    }
    else
    {
      for (let i = 0; i < cards.length; i++)
      {
        api.removeChild(cards[i]);
      }

      cards.length = 0;
    }
  });
}

/** @param { Card } card
* @param { PackageData } extension
*/
export function extensionDeleteCard(card, extension)
{
  const { button, text } = extensionCard(card, extension);

  text.innerText = 'Delete';

  button.events.onclick = () =>
  {
    button.disable();

    text.innerText = 'Deleting';
  
    deleteDir(extension.name)
      .then(() =>
      {
        success(button, text);
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
  card.auto({ title: name, description: 'Requesting Package Data...' });
  
  card.disable();

  getPackageData(name)
    .then((data) =>
    {
      const validated = validateExtension(data);

      if (validated)
        throw validated;

      const { button, text } = extensionCard(card, data);
    
      text.innerText = 'Install';

      button.events.onclick = () =>
      {
        button.disable();

        downloadExtension(button, text, data.name, data.dist.tarball)
          .then(() =>
          {
            return installExtensionDependencies(text, data.name);
          })
          .then(() =>
          {
            success(button, text);
          })
          .catch(() =>
          {
            failedToInstall(card, name);
          });
      };
    })
    .catch((err) =>
    {
      failedToInstall(card, name, err);
    });
}

/** @param { Card } card
* @param { PackageData } local
* @param { PackageData } remote
* @param { string } name
*/
export function extensionUpdateCard(card, local, remote, name)
{
  if (validateExtension(remote))
    return false;

  const { button, text } = extensionCard(card, remote, local);

  text.innerText = 'Update';

  button.events.onclick = () =>
  {
    button.disable();

    downloadExtension(button, text, remote.name, remote.dist.tarball)
      .then(() =>
      {
        return installExtensionDependencies(text, remote.name);
      })
      .then(() =>
      {
        success(button, text);
      })
      .catch(() =>
      {
        failedToInstall(card, name);
      });
  };

  return true;
}

/** @param { string } name
*/
export function getPackageData(name)
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
* @returns { { button: Card, text: HTMLElement } }
*/
function extensionCard(card, data, oldData)
{
  card.reset();

  card.auto({
    title: data.sulaiman.displayName,
    description: data.description,
    actionIcon: api.getIcon('arrow')
  });

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
    card.appendLineSeparator();

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

  card.appendLineSeparator();

  // button section

  const button = new Card();
  
  card.appendChild(button);
  
  const text = button.appendText('', { align: 'Center', style: 'Bold' });

  return { button, text };
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
    return 'package is not a sulaiman extension';

  if (!data.sulaiman.displayName)
    return 'invalid package information: display name';

  if (data.sulaiman.platform && !data.sulaiman.platform.includes(process.platform.toString()))
    return 'this platform is not supported by the extension';

  return undefined;
}

/** @param { Card } button
* @param { HTMLElement } text
* @param { string } name
* @param { string } url
* @returns { Promise<void> }
*/
function downloadExtension(button, text, name, url)
{
  return new Promise((resolve, reject) =>
  {
    const filename = basename(url);
    const dirname = name;
  
    const tmpDir = tmpdir() + '/sulaiman/' + Date.now();
  
    const tmpCompressed = join(tmpdir(), filename);
    const tmpDecompressed = join(tmpDir, dirname);
  
    const output = join(__dirname, '../extensions/' + dirname);

    wget(url,
      {
        onProgress: (progress) =>
        {
          const percentage = (progress.percentage * 100).toFixed(0);

          button.setProgressBar(percentage);
          
          text.innerText = 'Downloading ' + percentage + '%';
        },
        output: tmpCompressed
      })
      .then(() =>
      {
        const extract = inly(tmpCompressed, tmpDecompressed);
  
        extract.on('progress', (percentage) =>
        {
          button.setProgressBar(percentage);
          
          text.innerText = 'Decompressing ' + percentage + '%';
        });
  
        extract.on('error', (err) =>
        {
          reject(err);
        });
  
        extract.on('end', () =>
        {
          button.setProgressBar(0);

          move(tmpDecompressed + '/package', output, { overwrite: true }).then(() =>
          {
            resolve();
          });
        });
      })
      .catch((err) =>
      {
        reject(err);
      });
  });
}

/** @param { HTMLElement } text
* @param { string } name
* @returns { Promise<void> }
*/
function installExtensionDependencies(text, name)
{
  return new Promise((resolve, reject) =>
  {
    text.innerText = 'Installing Dependencies';

    const dir = join(__dirname, '../extensions/' + name);

    const orgPrefix = npm.prefix;
  
    npm.prefix = dir;
  
    readFile(dir + '/package.json')
      .then((file) =>
      {
        const data = JSON.parse(file);
  
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
* @param { HTMLElement } text
*/
function success(button, text)
{
  button.enable();
  button.events.onclick = reload;
  
  text.innerText = 'Reload';
}

/** @param { Card } card
/** @param { string } name
/** @param { string } err
*/
function failedToInstall(card, name, err)
{
  deleteDir(name).then(() =>
  {
    card.auto({ title: name, description: 'Failed to Install' + ((err) ? '\n' + err : '') });

    const button = new Card();
  
    card.appendLineSeparator();

    card.appendChild(button);
    
    button.appendText('Try Again', { align: 'Center', style: 'Bold' });
    
    button.events.onclick = () =>
    {
      extensionInstallCard(card, name);
    };
  });
}