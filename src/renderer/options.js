import { remote } from 'electron';

import { Card, createCard, appendCard, removeCard, on } from './api';
import { showHide } from './renderer';

export let autoHide = false;

// /** @type { Card }
// */
// let phraseCard = undefined;

/** @type { Card }
*/
let showHideKeyCard = undefined;

export function loadOptions()
{
  if (process.env.DEBUG)
    return;

  loadShowHideKey();
}

export function registerOptionsPhrase()
{
  const card = on.phrase('options', [ 'show/hide key' ],
    (argument) =>
    {
      card.reset();

      if (argument === 'show/hide key')
        showChangeKeyCard(card, 'Show/Hide', 'Set a new shortcut key', 'showHideKey', showHide);
    });
}

function loadShowHideKey()
{
  showHideKeyCard = createCard();

  const showHideAccelerator = localStorage.getItem('showHideKey');
  
  if (!showHideAccelerator)
  {
    showChangeKeyCard(
      showHideKeyCard,
      'Hello there, ',
      'It looks like it\'s your first time using Sulaiman, Start by choosing a shortcut for summoning the application anytime you need it.',
      'showHideKey',
      showHide,
      () => autoHide = true
    );

    appendCard(showHideKeyCard);

    showHide(true);
  }
  else if (remote.globalShortcut.isRegistered(showHideAccelerator))
  {
    showChangeKeyCard(
      showHideKeyCard,
      'Sorry, It looks like',
      'A different application is using the shortcut you selected for summoning Sulaiman; we recommend to setting a new one.',
      'showHideKey',
      showHide,
      () => autoHide = true
    );

    appendCard(showHideKeyCard);

    showHide(true);
  }
  else
  {
    remote.globalShortcut.register(showHideAccelerator, showHide);
  }
}

/** @param { Card } card
* @param { string } title
* @param { string } description
* @param { () => void ) } [callback]
*/
function showChangeKeyCard(card, title, description, key, callback, done)
{
  card.auto({ title: title, description: description });

  captureKey(card, (accelerator) =>
  {
    unregisterGlobalShortcut(localStorage.getItem(key));

    localStorage.setItem(key, accelerator);
    
    remote.globalShortcut.register(accelerator, callback);

    removeCard(card);

    if (done)
      done();
  });
}

/** make the card apply to capture key downs and turns them to accelerators
* @param { Card } card
* @param { (accelerator: Electron.Accelerator) => void } callback
*/
function captureKey(card, callback)
{
  const keys = [];

  const keysElem = card.appendText('', { size: 'Big', style: 'Bold' });

  card.appendLineSeparator();

  const setButtonCard = createCard();
  const setButton = setButtonCard.appendText('Set', { align: 'Center' });
  card.appendChild(setButtonCard);

  const cancelButtonCard = createCard();
  cancelButtonCard.appendText('Cancel', { align: 'Center' });
  card.appendChild(cancelButtonCard);

  keysElem.style.display = 'none';
  cancelButtonCard.domElement.style.display = 'none';

  /** @param {KeyboardEvent} event
  */
  const keyCapture = (event) =>
  {
    keys.length = 0;

    if (event.ctrlKey)
      keys.push('Control');

    if (event.altKey)
      keys.push('Alt');

    if (event.shiftKey)
      keys.push('Shift');

    let code = event.key;

    if (code === ' ')
      code = 'Space';
      
    if (code === 'Meta')
      code = 'Alt';

    if (code === '+')
      code = 'Plus';

    if (!(/^[a-z]*$/).test(code) && event.code.startsWith('Key'))
      code = event.code.replace('Key', '');
      
    code = code[0].toUpperCase() + code.substring(1);

    if (!keys.includes(code))
      keys.push(code);

    keysElem.innerText = keys.join(' + ');

    if (checkGlobalShortcut(keys.join('+')))
      setButtonCard.enable();
    else
      setButtonCard.disable();
  };

  const cancelKeyCapture = () =>
  {
    keysElem.style.display = 'none';
    cancelButtonCard.domElement.style.display = 'none';

    setButton.innerText = 'Set';

    setButtonCard.domElement.onclick = startKeyCapture;
    setButtonCard.enable();

    window.removeEventListener('keydown', keyCapture);
  };

  const startKeyCapture = () =>
  {
    keysElem.style.cssText = '';
    cancelButtonCard.domElement.style.cssText = '';
      
    keysElem.innerText = 'Press The Keys';
    setButton.innerText = 'Apply';

    setButtonCard.domElement.onclick = () =>
    {
      callback(keys.join('+'));

      cancelKeyCapture();
    };

    setButtonCard.disable();

    window.addEventListener('keydown', keyCapture);
  };

  setButtonCard.domElement.onclick = startKeyCapture;
  cancelButtonCard.domElement.onclick = cancelKeyCapture;
}

/**
* @param { Electron.Accelerator } accelerator
*/
function checkGlobalShortcut(accelerator)
{
  try
  {
    if (remote.globalShortcut.isRegistered(accelerator))
      return false;
    else
      return true;
  }
  catch (err)
  {
    return false;
  }
}

/**
* @param { Electron.Accelerator } accelerator
*/
function unregisterGlobalShortcut(accelerator)
{
  try
  {
    if (remote.globalShortcut.unregister(accelerator))
      return false;
    else
      return true;
  }
  catch (err)
  {
    return false;
  }
}