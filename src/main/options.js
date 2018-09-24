import { Menu, Tray, app, nativeImage } from 'electron';

import { join } from 'path';

import * as settings from 'electron-json-config';

import { showHide } from './window.js';

export let trayIcon;

const trayMenuTemplate = [
  {
    label: 'Sulaiman',
    enabled: false
  },
  {
    type: 'separator'
  },
  {
    label: 'Show/Hide', click()
    {
      showHide();
    }
  },
  {
    label: 'Quit', click()
    {
      app.quit();
    }
  }
];

export function loadOptions()
{
  if (process.env.DEBUG)
    return;
  
  loadTrayIcon();
}

function loadTrayIcon()
{
  if (trayIcon)
    return;

  const enabled = settings.get('trayIcon', true);

  if (enabled)
  {
    const trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
    const trayIconImage = nativeImage.createFromPath(join(__dirname, '../../tray.png'));
  
    trayIcon = new Tray(trayIconImage);

    trayIcon._setContextMenu = trayIcon.setContextMenu;

    trayIcon.setContextMenu = function(menu)
    {
      trayIcon._setContextMenu(menu);
      
      trayIcon.contextMenu = menu;
    };

    trayIcon.setContextMenu(trayMenu);
  }
}