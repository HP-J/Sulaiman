import { BrowserWindow, app, screen, globalShortcut } from 'electron';

import path from 'path';
import url from 'url';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
/** @type { BrowserWindow }
*/
let mainWindow;

function createWindow ()
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
      frame: false,
      resizable: false,
      skipTaskbar: true,
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
  mainWindow.on('closed', function () 
  {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // how to restore the app when it's hidden, this can fail if
  // the shortcut is being used by another application
  globalShortcut.register('Control+Space', focus);

  // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

/** @param { string[] } argv the args that was sent from the second instance
* @param { string } workingDirectory the current working directory
*/
function singleInstance()
{
  focus();
}

function focus()
{
  mainWindow.show();
  mainWindow.setSkipTaskbar(true);
}

// if the user tried to open more instance while a one is already opened
// then quit the new ones and focus on the opened one instead
if (app.makeSingleInstance(singleInstance))
{
  app.quit();
}

// fix chrome/linux color issue
app.commandLine.appendSwitch('--force-color-profile', 'sRBG');

// disables v-sync
// app.commandLine.appendArgument('--disable-gpu-vsync');

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () 
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

app.on('activate', function () 
{
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) 
    createWindow();
});

// import { VM } from 'vm2';
// const vm = new VM();

// vm.run('process.exit()');

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.