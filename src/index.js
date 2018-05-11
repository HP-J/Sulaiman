import { remote, screen } from 'electron';

const currentWindow = remote.getCurrentWindow();
const screenSize = screen.getPrimaryDisplay().workAreaSize;

/** @param { number } number 
* @param { number } p 
*/
function mp(number, p)
{
  return Math.floor(number * (p / 100));
}

const size =
{
  x: mp(screenSize.width, 60),
  yOpened: mp(screenSize.height, 70),
  yClosed: mp(screenSize.height, 8),
};

const location =
{
  x: Math.floor((screenSize.width - size.x) / 2),
  y: Math.floor((screenSize.height - size.yOpened) / 2),
};

currentWindow.setSize(size.x, size.yClosed);
currentWindow.setPosition(location.x, location.y);

// TODO if the app lost focus, hide it

// window.onkeyup = (event) =>
// {
//   if (event.keyCode === 27)
//     currentWindow.close();
// };