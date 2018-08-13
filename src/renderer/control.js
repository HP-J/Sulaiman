import { PackageMeta } from './registry.js';

import * as ext from './api.js';
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
      actionIcon: ext.getIcon('expand')
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
  ext.appendChild(card);
}

/** @param { Card } button
* @param { HTMLElement } text
* @param { PackageMeta } extension
*/
function deleteExtension(button, text, extension)
{
  text.innerText = 'Deleting';
  
  button.events.onclick = undefined;

  remove(join(__dirname, '../extensions/' + extension.name))
    .catch(() =>
    {
      reload();
    })
    .then(() =>
    {
      success(button, text);
    });
}

/** install an extension package from the npm registry
* @param { Card } button
* @param { HTMLElement } text
* @param { string } name
*/
function installExtension(button, text, name)
{
  text.innerText = 'Installing';
  
  button.events.onclick = undefined;

  getExtensionNPMData(name, (err, url, version) =>
  {
    downloadExtension(url, version, () =>
    {
      console.log('downloaded');

      installExtensionDependencies(name);
    });
  });
}

/** @param { string } name
* @returns { (err: Error, url: string, version: string) => void }
*/
function getExtensionNPMData(name, callback)
{
  npm.load((err) =>
  {
    if (err)
    {
      callback(err);

      return;
    }

    npm.commands.view([ name, 'dist.tarball' ], (err, data) =>
    {
      if (err)
      {
        callback(err);

        return;
      }

      const version = Object.keys(data)[0];
      
      const url = data[version]['dist.tarball'];
      
      callback(undefined, url, version);
    });
  });
}

/** @param { string } url
* @param { string } version
* @param { (err: Error) => void } callback
*/
function downloadExtension(url, version, callback)
{
  const filename = basename(url);
  const dirname = filename.replace('-' + version + '.tgz', '');

  const tmpDir = tmpdir() + '/sulaiman/' + Date.now();

  const tmpCompressed = join(tmpdir(), filename);
  const tmpDecompressed = join(tmpDir, dirname);

  const output = join(__dirname, '../extensions/' + dirname);

  wget(url,
    {
      // onProgress: (progress) =>
      // {
      //   console.log(progress.percentage * 100);
      // },
      output: tmpCompressed
    })
    .catch((err) =>
    {
      callback(err);
    })
    .then(() =>
    {
      const extract = inly(tmpCompressed, tmpDecompressed);

      // extract.on('progress', (percentage) =>
      // {
      //   console.log(percentage);
      // });

      extract.on('error', (err) =>
      {
        callback(err);
      });

      extract.on('end', () =>
      {
        move(tmpDecompressed + '/package', output, { overwrite: true }).then(() =>
        {
          callback();
        });
      });
    });
}

/** @param { string } name
* @returns { (err: Error) => void }
*/
function installExtensionDependencies(name, callback)
{
  const dir = join(__dirname, '../extensions/' + name);

  const orgPrefix = npm.prefix;

  npm.prefix = dir;

  readFile(dir + '/package.json')
    .catch((err) =>
    {
      console.log(err);
    })
    .then((data) =>
    {
      const packageMeta = JSON.parse(data);

      const dependencies = [];

      for (const mod in packageMeta.dependencies)
      {
        dependencies.push(mod + '@' + packageMeta.dependencies[mod]);
      }

      npm.load({ prefix: dir, loaded: false }, (err) =>
      {
        if (err)
        {
          // callback(err);
          console.log(err);

          return;
        }

        // npmConfig.set('prefix', dir);

        npm.commands.prefix([ dir ], (err) =>
        {
          if (err)
          {
            // callback(err);
            console.log(err);
  
            return;
          }

          npm.commands.install(dependencies, (err) =>
          {
            if (err)
            {
              // callback(err);
              console.log(err);
          
              return;
            }
  
            npm.prefix = orgPrefix;

            console.log('done');
          });
        });

        npm.on('log', (msg) =>
        {
          console.log(msg);
        });
      });
    });
}

/** @param { Card } button
* @param { HTMLElement } text
*/
function success(button, text)
{
  text.innerText = 'Reload';

  button.events.onclick = reload;
}