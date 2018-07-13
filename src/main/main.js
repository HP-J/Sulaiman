import { BrowserWindow, app, screen, globalShortcut } from 'electron';

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

  mainWindow = new BrowserWindow(
    {
      show: (process.env.DEBUG) ? true : false,
      frame: (process.env.DEBUG) ? true : false,
      resizable: (process.env.DEBUG) ? true : false,
      skipTaskbar: (process.env.DEBUG) ? false : true,
      width: width,
      height: height,
      x: Math.round((screenSize.width - width) / 2),
      y: Math.round((screenSize.height - height) / 2)
    }
  );

  // reminder that the open instance of the app is
  // inside is a debug instance and not meant for normal use
  mainWindow.setTitle((process.env.DEBUG) ?
    '[ DEBUG ENVIRONMENT ] Sulaiman' :
    'Sulaiman');

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

  // how to restore the app when it's hidden, this can fail if
  // the shortcut is being used by another application
  if (!process.env.DEBUG)
    globalShortcut.register('Control+Space', focus);
}

function focus()
{
  mainWindow.restore();

  mainWindow.show();
  
  mainWindow.setSkipTaskbar((process.env.DEBUG) ? false : true);

  mainWindow.focus();
}

// if the user tried to open a new instance while a one is already open
// and the new instance is not inside a debug environment
// then quit the new instance and focus on the opened instance
app.on('second-instance', () =>
{
  if (mainWindow)
    focus();
});

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