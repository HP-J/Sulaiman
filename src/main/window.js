/** @type { Electron.BrowserWindow }
*/
export let mainWindow;

/** @type { Electron.App }
*/
export let app;

/** if the app icon should be shown in the taskbar
* @type { Electron.BrowserWindow }
*/
export let skipTaskbar = false;

let debugMode = false;
let shownMode = true;

/** @param { Electron.BrowserWindow } _window
*/
export function setWindow(_window)
{
  mainWindow = _window;
}

/** @param { Electron.App } _app
*/
export function setApp(_app)
{
  app = _app;
}

/** if the app is in debug mode
*/
export function isDebug()
{
  if (process.argv.includes('--debug'))
    debugMode = true;

  return debugMode;
}

/** if the app started hidden (auto-launch)
*/
export function isHidden()
{
  if (process.argv.includes('--hidden'))
    shownMode = false;

  return shownMode;
}

/** reloads the main browser window
*/
export function reload()
{
  mainWindow.reload();
}

/** focus on the main window
*/
export function focus()
{
  mainWindow.restore();

  mainWindow.show();
  
  mainWindow.focus();
}

/** quit the app
*/
export function quit()
{
  app.quit();
}

/** shows/hides the app's main window
*/
export function showHide()
{
  if (!mainWindow.isVisible() || !mainWindow.isFocused())
  {
    mainWindow.restore();

    mainWindow.show();

    // only restore to the taskbar if the option is enabled
    mainWindow.setSkipTaskbar(skipTaskbar);

    mainWindow.focus();
  }
  else
  {
    mainWindow.blur();
    mainWindow.hide();
  }
}

/** show or hide the icon in the taskbar
*/
export function setSkipTaskbar(state)
{
  skipTaskbar = state;

  mainWindow.setSkipTaskbar(state);
}