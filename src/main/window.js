/** @type { Electron.BrowserWindow }
*/
export let mainWindow;

/** @type { Electron.App }
*/
export let app;

/** @type { Electron.BrowserWindow }
*/
export let skipTaskbar;

/** @type { boolean }
*/
let debugMode = undefined;

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

/** reloads the electron browser window
*/
export function reload()
{
  mainWindow.reload();
}

export function relaunch()
{
  app.relaunch();
  app.quit();
}

export function isDebug()
{
  if (debugMode === undefined)
    debugMode = process.argv.includes('--debug');

  return debugMode;
}

export function quit()
{
  app.quit();
}

/** shows/hides the main window
*/
export function showHide()
{
  if (!mainWindow.isVisible() || !mainWindow.isFocused())
  {
    mainWindow.restore();

    mainWindow.show();

    mainWindow.setSkipTaskbar(skipTaskbar);

    mainWindow.focus();
  }
  else
  {
    mainWindow.blur();
    mainWindow.hide();
  }
}

export function setSkipTaskbar(state)
{
  skipTaskbar = state;

  mainWindow.setSkipTaskbar(state);
}