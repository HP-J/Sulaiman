import { on, shell, createCard, getPlatform } from 'sulaiman';

import { readFile, readdir, pathExists, stat } from 'fs-extra';

import { join, basename } from 'path';
import { homedir } from 'os';
import { exec } from 'child_process';

/** @type { Object<string, string> }
*/
const apps = {};

const platform = getPlatform();

/** @param { string[] } directories
* @param { string } extension
* @param { (file: string) => void } callback
* @returns { Promise<string[]> }
*/
function walk(directories, extension, callback)
{
// return empty array if directories array is empty
  if (directories.length <= 0)
    return;

  for (let i = 0; i < directories.length; i++)
  {
    const dir = directories[i];

    pathExists(dir).then((exists) =>
    {
      if (!exists)
        return;
      
      readdir(dir).then((list) =>
      {
        if (list.length > 0)
        {
          list.forEach((file) =>
          {
            file = join(dir, file);

            stat(file).then((statValue) =>
            {
              if (statValue && statValue.isDirectory())
              {
                walk([ file ]).then((files) =>
                {
                  files.forEach((file) =>
                  {
                    if (file.startsWith(extension))
                      callback(file);
                  });
                });
              }
              else
              {
                if (file.startsWith(extension))
                  callback(file);
              }
            });
          });
        }
      });
    });
  }
}

/** @param { string } execPath
*/
function launch(execPath)
{
  if (platform === 'Windows')
  {
    shell.openItem(execPath);
  }
  else if (platform === 'Linux')
  {
    // Linux
    // Replace %u and other % arguments in exec script
    // https://github.com/KELiON/cerebro/pull/62#issuecomment-276511320
    exec(execPath.replace(/%./g, ''));
  }
}

// function registerPhrases()
// {
//   on.ready(() =>
//   {
//     const appsAsNames = Object.keys(apps);

//     if (appsAsNames.length <= 0)
//       return;

//     const button = createCard();

//     on.phrase(
//       'Launch',
//       appsAsNames,
//       {
//         activate: (card, suggestion, match, argument) =>
//         {
//           card.auto({ title: argument, description: 'Launch the application' });

//           button.setType({
//             type: 'Button',
//             title: 'Launch',
//             callback: () => launch(apps[argument])
//           });
  
//           card.appendLineBreak();
//           card.appendChild(button);
//         },
//         enter: (suggestion, match, argument) =>
//         {
//           launch(apps[argument]);
  
//           return { input: 'clear', searchBar: 'blur' };
//         }
//       });
//   });
// }

if (platform === 'Windows')
{
  // directories where usually app shortcuts exists

  const { APPDATA, ProgramData } = process.env;

  const windowsAppDirectories =
  [
    join(APPDATA, '/Microsoft/Windows/Start Menu/'),
    join(ProgramData, '/Microsoft/Windows/Start Menu/')
  ];

  walk(windowsAppDirectories, '.lnk', (file) =>
  {
    let target;
    const name = basename(file, '.lnk');

    try
    {
      target = shell.readShortcutLink(file).target;
    }
    catch (e)
    {
      //
    }
    finally
    {
      apps[name] = target || file;
    }
  });
}
else if (platform === 'Linux')
{
  // directories where usually the desktop files exists

  const linuxAppDirectories =
  [
    '/usr/share/applications/',
    '/usr/local/share/applications/',
    join(homedir(), '/.local/share/applications/')
  ];

  walk(linuxAppDirectories, '.desktop', (file) =>
  {
    readFile(file, { encoding: 'utf8' })
      .then((desktopFile) =>
      {
        const hidden = desktopFile.match(/^(?:NoDisplay=)(.+)/m);
        const terminal = desktopFile.match(/^(?:Terminal=)(.+)/m);
    
        if ((hidden && hidden[1] === 'true') ||
          (terminal && terminal[1] === 'true')
        )
        {
          return;
        }
    
        const name = desktopFile.match(/^(?:Name=)(.+)/m);
        const exec = desktopFile.match(/^(?:Exec=)(.+)/m);
    
        if (name && exec)
          apps[name[1]] = exec[1];
      });
  });
}