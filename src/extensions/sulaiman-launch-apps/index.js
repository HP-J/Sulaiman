import * as sulaiman from 'sulaiman';

import { readdirSync, existsSync, statSync, readFileSync } from 'fs';

import { join, basename } from 'path';
import { homedir, platform as getPlatform } from 'os';
import { exec } from 'child_process';

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

function launch(execPath)
{
  if (platform === 'win32')
  {
    sulaiman.shell.openItem(execPath);
  }
  else
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
    let name = '';

    const button = sulaiman.createCard({ title: 'Launch' });

    button.setType({ type: 'Button' });

    sulaiman.on.phrase(
      'Launch',
      phraseArgs,
      undefined,
      // on activation
      (phrase, match, argument) =>
      {
        // set app name
        name = argument;

        phrase.card.auto({ title: name,  });

        button.domElement.onclick = () =>
        {
          launch(apps[name]);
    
          phrase.card.auto({ description: 'has been launched' });
          phrase.card.removeChild(button);
    
          phrase.card.setType({ type: 'Disabled' });
        };

        phrase.card.appendChild(button);

        phrase.card.setType({ type: 'Normal' });
      },
      // on enter
      () =>
      {
        launch(apps[name]);

        return true;
      })
      // after phrase is created
      .then((card) =>
      {
        card.auto({ description: 'launch the application' });
      });
  });
}

// if (platform === 'win32')
//   windows().then(registerPhrases);
// else
//   linux().then(registerPhrases);