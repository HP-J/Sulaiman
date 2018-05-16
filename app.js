const electron = require('electron');

const { openProcessManager } = require('electron-process-manager');

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
/** @type { BrowserWindow }
*/
let mainWindow;

function createWindow () 
{
  // Create the browser window.
  mainWindow = new BrowserWindow(
    {
      frame: false,
      resizable: false,
      skipTaskbar: true,
      width: 0,
      height: 0
    }
  );

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, './src/index.html'),
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

  // how to restore the app when it's hidden
  electron.globalShortcut.register('Control+Space', () =>
  {
    mainWindow.show();
    mainWindow.setSkipTaskbar(true);
  });

  // openProcessManager();
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

/** @param { string[] } argv the args that was sent from the second instance
* @param { string } workingDirectory the current working directory
*/
function singleInstance(argv, workingDirectory)
{
  // TODO call focus() from renderer-process
}

// if the user tried to open more instance while a one is already opened
// then quit the new ones
if (app.makeSingleInstance(singleInstance)) 
{
  app.quit();

  return;
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
  electron.globalShortcut.unregisterAll();
});

app.on('activate', function () 
{
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) 
    createWindow();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.