import { PackageMeta } from './registry.js';

import * as api from './api.js';
import Card from './card.js';

import { reload } from './renderer.js';

import { tmpdir } from 'os';
import { remove, move, readFile } from 'fs-extra';
import { join, basename } from 'path';

import request from 'request-promise-native';
import wget from 'node-wget-promise';
import inly from 'inly';

const npm = require('npm');

export function initNPM()
{
  npm.load((err) =>
  {
    if (err)
      throw err;
  });
}

/** @param { Card } card
* @param { PackageMeta } extension
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

  request('https://registry.npmjs.org/'+ name + '/latest', { json: true })
    .then((value) =>
    {
      if (!value.sulaiman)
        throw 'not a sulaiman extension';

      if (!value.sulaiman.displayName)
        throw 'invalid package information: display name';

      const { button, text } = extensionCard(card, value);
      
      text.innerText = 'Install';

      button.events.onclick = () =>
      {
        downloadExtension(button, text, value.name, value.dist.tarball)
          .then(() =>
          {
            return installExtensionDependencies(text, value.name);
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
* @param { PackageMeta } extension
* @returns { { button: Card, text: HTMLElement } }
*/
function extensionCard(card, extension)
{
  card.reset();

  card.auto({
    title: extension.sulaiman.displayName,
    description: extension.description,
    actionIcon: api.getIcon('arrow')
  });

  // permissions section

  card.appendLineSeparator();

  if (extension.sulaiman.permissions && extension.sulaiman.permissions.length > 0)
  {
    const permissions = extension.sulaiman.permissions.join('\n');

    card.appendText('PERMISSIONS', { size: 'Smaller', style: 'Bold' });
    card.appendText(permissions, { type: 'Description', size: 'Smaller' });
  }
  
  // modules section3
  
  if (extension.sulaiman.modules && extension.sulaiman.modules.length > 0)
  {
    const modules = extension.sulaiman.modules.join('\n');

    card.appendText('MODULES', { size: 'Smaller', style: 'Bold' });
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
      .then((data) =>
      {
        const packageMeta = JSON.parse(data);
  
        const dependencies = [];
  
        for (const mod in packageMeta.dependencies)
        {
          dependencies.push(mod + '@' + packageMeta.dependencies[mod]);
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