import { Menu, Tray, app, nativeImage } from 'electron';

import { join } from 'path';

import * as settings from 'electron-json-config';

import { showHide } from './window.js';

let trayIcon;
let trayIconImage;

const trayMenu = Menu.buildFromTemplate([
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
]);

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
    trayIconImage = nativeImage.createFromPath(join(__dirname, '../../tray.png'));
  
    trayIcon = new Tray(trayIconImage);
    trayIcon.setContextMenu(trayMenu);
  }
}