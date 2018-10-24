import * as sulaiman from 'sulaiman';

import { readdirSync, existsSync, statSync, readFileSync } from 'fs';

import { join, basename } from 'path';
import { homedir, platform as getPlatform } from 'os';
import { exec } from 'child_process';

/** @type { Object<string, sting> }
*/
const apps = {};

const platform = getPlatform();

/** @param { string[] } directories
* @returns { string[] }
*/
function walkSync(directories)
{
  let results = [];

  for (let i = 0; i < directories.length; i++)
  {
    const dir = directories[i];

    if (!existsSync(dir))
      continue;

    const list = readdirSync(dir);

    list.forEach((file) =>
    {
      file = join(dir, file);
      
      const stat = statSync(file);
  
      if (stat && stat.isDirectory())
        // Recurs into a subdirectory
        results = results.concat(walkSync([ file ]));
      else
        // Is a file
        results.push(file);
    });
  }

  return results;
}

function windows()
{
  const { APPDATA, ProgramData } = process.env;

  // directories where usually app shortcuts exists
  const appDirectories =
  [
    join(APPDATA, '/Microsoft/Windows/Start Menu/'),
    join(ProgramData, '/Microsoft/Windows/Start Menu/')
  ];

  // the usual extensions for the apps in this os
  const appExtension = '.lnk';

  return new Promise((resolve) =>
  {
    const files = walkSync(appDirectories);
    
    for (let i = 0; i < files.length; i++)
    {
      const file = files[i];
      
      // if it ends with the specified extension
      if (file.endsWith(appExtension))
      {
        const name = basename(file, appExtension);
        let target;

        try
        {
          target = sulaiman.shell.readShortcutLink(file).target;
        }
        catch (e)
        {
          //
        }
        finally
        {
          apps[name] = target || file;
        }
      }
    }
    
    resolve();
  });
}

function linux()
{
  // directories where usually app shortcuts exists
  const appDirectories =
  [
    '/usr/share/applications/',
    '/usr/local/share/applications/',
    join(homedir(), '/.local/share/applications/')
  ];

  // the usual extensions for the apps in this os
  const appExtension = '.desktop';

  return new Promise((resolve) =>
  {
    const files = walkSync(appDirectories);

    for (let i = 0; i < files.length; i++)
    {
      const file = files[i];
      
      // if it ends with the specified extension
      if (file.endsWith(appExtension))
      {
        const desktopFile = readFileSync(file).toString();

        const hidden = desktopFile.match(/^(?:NoDisplay=)(.+)/m);

        if (hidden && hidden[1] === 'true')
          continue;

        const name = desktopFile.match(/^(?:Name=)(.+)/m);
        const exec = desktopFile.match(/^(?:Exec=)(.+)/m);

        if (name && exec)
          apps[name[1]] = exec[1];
      }
    }

    resolve();
  });
}

function launch(execPath)
{
  if (platform === 'win32')
  {
    sulaiman.shell.openItem(execPath);
  }
  else if (platform === 'linux')
  {
    // Linux
    // Replace %u and other % arguments in exec script
    // https://github.com/KELiON/cerebro/pull/62#issuecomment-276511320
    exec(execPath.replace(/%./g, ''));
  }
}

function registerPhrases()
{
  sulaiman.on.ready(() =>
  {
    const appsAsNames = Object.keys(apps);

    if (appsAsNames.length <= 0)
      return;

    const button = sulaiman.createCard();

    button.setType({ type: 'Button' });

    sulaiman.on.phrase(
      'Launch',
      appsAsNames,
      {
        activate: (card, suggestion, match, argument) =>
        {
          card.auto({ title: argument, description: 'Launch the application' });
          button.auto({ title: 'Launch' });
  
          button.domElement.onclick = () =>
          {
            launch(apps[argument]);
      
            card.auto({ description: 'Has been launched' });
            button.auto({ title: 'Launch Again' });
          };
  
          card.appendChild(button);
        },
        enter: (suggestion, match, argument) =>
        {
          launch(apps[argument]);
  
          return { searchBarInput: 'clear-search-bar', blurSearchBar: true };
        }
      });
  });
}

if (platform === 'win32')
  windows().then(registerPhrases);
else if (platform === 'linux')
  linux().then(registerPhrases);