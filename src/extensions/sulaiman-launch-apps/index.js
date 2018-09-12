import * as sulaiman from 'sulaiman';
// import * as sulaiman from '../../../';

import { readdirSync, existsSync, statSync, readFileSync } from 'fs';

import { join, basename } from 'path';
import { homedir, platform as getPlatform } from 'os';
import { exec as execute } from 'child_process';

const phraseArgs = [];

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

  // directories where usually shortcut, links or the apps themselves exists
  const appDirectories =
  [
    join(APPDATA, '/Microsoft/Windows/Start Menu/Programs/'),
    join(ProgramData, '/Microsoft/Windows/Start Menu/Programs/')
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

        phraseArgs.push(name);

        apps[name] = file;
      }
    }
    
    resolve();
  });
}

function linux()
{
  // directories where usually shortcut, links or the apps themselves exists
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
        const fileParsed = {};
                              
        // read the file and parse it content to a javascript object
        const fileRead = readFileSync(file).toString().split('\n');
            
        for (let i = 0; i < fileRead.length; i++)
        {
          const splitIndex = fileRead[i].indexOf('=');
            
          const key = fileRead[i].substring(0, splitIndex).trim();
          const value = fileRead[i].substring(splitIndex + 1).trim();
            
          if (key.length > 0 && value.length > 0)
            fileParsed[key] = value;
        }
            
        if (fileParsed.NoDisplay)
          continue;

        phraseArgs.push(fileParsed.Name);

        apps[fileParsed.Name] = fileParsed.Exec;
      }
      
      resolve();
    }
  });
}

function registerPhrases()
{
  sulaiman.on.ready(() =>
  {
    const launch = (exec) =>
    {
      if (platform === 'win32')
      {
        sulaiman.shell.openItem(exec);
      }
      else
      {
        // Linux
        // Replace %u and other % arguments in exec script
        // https://github.com/KELiON/cerebro/pull/62#issuecomment-276511320
        execute(exec.replace(/%./g, ''));
      }

      card.auto({ description: 'has been launched' });
      card.removeChild(button);
      card.disable();
    };

    let name = '';
    const button = sulaiman.createCard();
    
    button.appendText('Launch', { align: 'Center' });

    button.domElement.onclick = () =>
    {
      launch(apps[name]);
    };

    const card = sulaiman.on.phrase(
      'Launch',
      phraseArgs,
      // change the card to feature the app chosen
      (argument) =>
      {
        name = argument;

        card.auto({ title: name, description: 'launch the application' });
        card.appendChild(button);
        card.enable();
      },
      // on pressing Enter
      () =>
      {
        launch(apps[name]);

        return true;
      });
  });
}

if (platform === 'win32')
  windows().then(registerPhrases);
else if (platform === 'linux')
  linux().then(registerPhrases);
else
  throw new Error('sulaiman-launch-apps doesn\'t work on ' + platform);