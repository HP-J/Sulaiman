import { BrowserWindow, app, screen, ipcMain, globalShortcut, dialog } from 'electron';

import path from 'path';
import url from 'url';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
/** @type { BrowserWindow }
*/
let mainWindow;

function createWindow()
{
  const screenSize = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.

  // set the electron window size
  // window's width is 50% of the screen's width
  // window's height is 65% of the screen's height

  // set the electron window location
  // center of the screen

  const width = Math.round(screenSize.width * 0.50);
  const height = Math.round(screenSize.height * 0.65);

  const isDEBUG = process.env.DEBUG !== undefined;

  mainWindow = new BrowserWindow(
    {
      title: 'Sulaiman',
      show: isDEBUG,
      frame: isDEBUG,
      skipTaskbar: !isDEBUG,
      resizable: isDEBUG,
      width: width,
      height: height,
      x: Math.round((screenSize.width - width) / 2),
      y: Math.round((screenSize.height - height) / 2)
    }
  );

  // and load the index.html of the app
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, '../index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Emitted when the window is closed.
  mainWindow.on('closed', () =>
  {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

if (!process.env.DEBUG && !app.requestSingleInstanceLock())
{
  app.quit();
}
else
{
  // workaround color issues
  app.commandLine.appendSwitch('--force-color-profile', 'sRBG');

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // handle any errors at the renderer process
  ipcMain.on('rendererError', (event, data) =>
  {
    dialog.showErrorBox('A Javascript error occurred in the renderer process', data);
    
    app.quit();
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () =>
  {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin')
      app.quit();
  });

  app.on('will-quit', () =>
  {
    // Unregister all shortcuts
    globalShortcut.unregisterAll();
  });

  app.on('activate', () =>
  {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null)
      createWindow();
  });
}