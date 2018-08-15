import { PackageMeta } from './registry.js';

import * as api from './api.js';
import Card from './card.js';

import { reload } from './renderer.js';

import { tmpdir } from 'os';
import { remove, move, readFile } from 'fs-extra';
import { join, basename } from 'path';

import wget from 'node-wget-promise';
import inly from 'inly';

const npm = require('npm');

/** @param { PackageMeta } extension
* @param { "Delete" | "Install" } action
* @param { () => void } callback
*/
export function appendExtensionCard(extension, action)
{
  const card = new Card(
    {
      title: extension.sulaiman.displayName,
      description: extension.description,
      actionIcon: api.getIcon('arrow')
    });

  // permissions section

  card.appendLineSeparator();

  const permissions = extension.sulaiman.permissions.join('\n');
  
  card.appendText('PERMISSIONS', { size: 'Smaller', style: 'Bold' });
  card.appendText(permissions, { type: 'Description', size: 'Smaller' });

  // modules section

  const modules = extension.sulaiman.modules.join('\n');

  card.appendText('MODULES', { size: 'Smaller', style: 'Bold' });
  card.appendText(modules, { type: 'Description', size: 'Smaller' });

  card.appendLineSeparator();

  // button section

  const button = new Card();
  
  card.appendChild(button);
  
  const text = button.appendText(action, { align: 'Center', style: 'Bold' });

  if (action === 'Delete')
  {
    button.events.onclick = () =>
    {
      deleteExtension(button, text, extension);
    };
  }
  else
  {
    button.events.onclick = () =>
    {
      installExtension(button, text, 'request');
    };
  }

  // append the control panel card to body
  api.appendChild(card);
}

/** @param { Card } button
* @param { HTMLElement } text
* @param { PackageMeta } extension
*/
function deleteExtension(button, text, extension)
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
}

/** @param { string } name
*/
function deleteDir(name)
{
  return remove(join(__dirname, '../extensions/' + name));
}

/** install an extension package from the npm registry
* @param { Card } button
* @param { HTMLElement } text
* @param { string } name
*/
function installExtension(button, text, name)
{
  button.disable();
  
  text.innerText = 'Requesting URL';

  getExtensionNPMData(name)
    .then(({ url, version }) =>
    {
      return downloadExtension(button, text, url, version);
    })
    .then(() =>
    {
      return installExtensionDependencies(text, name);
    })
    .then(() =>
    {
      success(button, text);
    })
    .catch(() =>
    {
      function failed()
      {
        text.innerText = 'Failed (Try Again)';
      }

      deleteDir(name).then(failed).catch(failed);
    });
}

/** @param { string } name
* @returns { Promise<{ url: string, version: string }> }
*/
function getExtensionNPMData(name)
{
  return new Promise((resolve, reject) =>
  {
    npm.load((err) =>
    {
      if (err)
      {
        reject(err);
        return;
      }
  
      npm.commands.view([ name, 'dist.tarball' ], (err, data) =>
      {
        if (err)
        {
          reject(err);
          return;
        }
  
        const version = Object.keys(data)[0];
        
        const url = data[version]['dist.tarball'];
        
        resolve({ url, version });
      });
    });
  });
}

/** @param { Card } button
* @param { HTMLElement } text
* @param { string } url
* @param { string } version
* @returns { Promise<void> }
*/
function downloadExtension(button, text, url, version)
{
  return new Promise((resolve, reject) =>
  {
    const filename = basename(url);
    const dirname = filename.replace('-' + version + '.tgz', '');
  
    const tmpDir = tmpdir() + '/sulaiman/' + Date.now();
  
    const tmpCompressed = join(tmpdir(), filename);
    const tmpDecompressed = join(tmpDir, dirname);
  
    const output = join(__dirname, '../extensions/' + dirname);

    wget(url,
      {
        onProgress: (progress) =>
        {
          const percentage = (progress.percentage * 100).toFixed(0);

          button.progressBar(percentage);
          
          text.innerText = 'Downloading ' + percentage + '%';
        },
        output: tmpCompressed
      })
      .then(() =>
      {
        const extract = inly(tmpCompressed, tmpDecompressed);
  
        extract.on('progress', (percentage) =>
        {
          button.progressBar(percentage);
          
          text.innerText = 'Decompressing ' + percentage + '%';
        });
  
        extract.on('error', (err) =>
        {
          reject(err);
        });
  
        extract.on('end', () =>
        {
          button.progressBar(0);

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
  
        npm.load((err) =>
        {
          if (err)
          {
            reject(err);
            return;
          }
  
          npm.commands.install(dependencies, (err) =>
          {
            if (err)
            {
              reject(err);
              return;
            }
  
            npm.prefix = orgPrefix;

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

/** @param { Card } button
* @param { HTMLElement } text
*/
function success(button, text)
{
  button.enable();
  button.events.onclick = reload;
  
  text.innerText = 'Reload';
}