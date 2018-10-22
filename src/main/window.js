/** @type { Electron.BrowserWindow }
*/
export let mainWindow;

/** @type { Electron.App }
*/
export let app;

/** @type { Electron.BrowserWindow }
*/
export let skipTaskbar;

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

export function isDebug()
{
  if (process.argv.includes('--debug'))
    debugMode = true;

  return debugMode;
}

export function isHidden()
{
  if (process.argv.includes('--hidden'))
    shownMode = false;

  return shownMode;
}

/** reloads the electron browser window
*/
export function reload()
{
  mainWindow.reload();
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