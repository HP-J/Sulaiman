import * as sulaiman from 'sulaiman';

import { readdirSync, existsSync, statSync, readFileSync } from 'fs';

import { join } from 'path';
import { homedir } from 'os';
import { exec } from 'child_process';

function linuxAppList()
{
  // directories where usually shortcut, links or the apps themselves exists
  const appDirectories =
  [
    '/usr/share/applications/',
    '/usr/local/share/applications/',
    homedir + '/.local/share/applications/'
  ];

  // the usual extensions for the apps in this os
  const appExtension = '.desktop';

  return new Promise((resolve) =>
  {
    const files = walkSync(appDirectories);

    files.forEach((file) =>
    {
      const apps = [];

      // if it ends with the specified extension
      if (file.endsWith(appExtension))
      {
        const fileParsed = {};
                        
        // read the file and parse it content to a javascript object
        file = readFileSync(file).toString().split('\n');
      
        for (let i = 0; i < file.length; i++)
        {
          const splitIndex = file[i].indexOf('=');
      
          const key = file[i].substring(0, splitIndex);
          const value = file[i].substring(splitIndex + 1);
      
          if (key.length > 0 && value.length > 0)
            fileParsed[key] = value;
        }
      
        apps.push(fileParsed);
      }

      resolve(apps);
    });
  });
}

function windowsAppList()
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
    
    const apps = [];

    files.forEach((file) =>
    {
      // if it ends with the specified extension
      if (file.endsWith(appExtension))
      {
        // console.log(file);
        // const fileParsed = {};
                        
        // // read the file and parse it content to a javascript object
        // file = readFileSync(file).toString().split('\n');
      
        // for (let i = 0; i < file.length; i++)
        // {
        //   const splitIndex = file[i].indexOf('=');
      
        //   const key = file[i].substring(0, splitIndex);
        //   const value = file[i].substring(splitIndex + 1);
      
        //   if (key.length > 0 && value.length > 0)
        //     fileParsed[key] = value;
        // }
      
        apps.push(file);

        // apps.push(fileParsed);
      }
    });
    
    resolve(apps);
  });
}

/** @param { string[] } directories
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

// windowsAppList().then((apps) =>
// {
// WIndows, Mac
// sulaiman.shell.openItem(apps[75]);

// Linux
// if NoDisplay is true don't show  the app on search
// Replace %u and other % arguments in exec script
// https://github.com/KELiON/cerebro/pull/62#issuecomment-276511320
// exec(apps[0].Exec.replace(/%./g, ''));
// });