import { remote } from 'electron';

import { join } from 'path';

import { getIcon } from './api.js';

import { loadExtensions, emit, on } from './loader.js';
import { loadNPM, registerExtensionsPhrase } from './manager.js';
import { autoHide, loadOptions, registerOptionsPhrase } from './options.js';
import { initSearchBar, internalRegisterPhrase as registerPhrase, registerPhrasesPhrase } from './search.js';

/** @typedef { import('./card.js').default } Card
*/

const { mainWindow, quit, reload } = remote.require(join(__dirname, '../main/window.js'));

export let readyState = false;

/** @param { Card } card
*/
export function makeItCollapsible(card)
{
  const arrowIcon = getIcon('arrow');

  card.auto({ actionIcon: arrowIcon });

  const titleElem = card.domElement.querySelector('.cardAuto.cardTitle');
  const extensionIconElem = card.domElement.querySelector('.cardAuto.cardIcon.cardExtensionIcon');
  const actionIconElem = card.domElement.querySelector('.cardAuto.cardIcon.cardActionIcon');
  const descriptionElem = card.domElement.querySelector('.cardAuto.cardDescription');
  
  if (titleElem)
    titleElem.onclick = () => toggleCollapse(card, arrowIcon);
  
  if (extensionIconElem)
    extensionIconElem.onclick = () => toggleCollapse(card, arrowIcon);

  if (actionIconElem)
    actionIconElem.onclick = () => toggleCollapse(card, arrowIcon);

  if (descriptionElem)
    descriptionElem.onclick = () => toggleCollapse(card, arrowIcon);
}

/** @param { Card } card
* @param { HTMLElement } [icon]
* @param { boolean } [fast]
* @param { boolean } [collapseOnly]
*/
export function toggleCollapse(card, icon, fast, collapseOnly)
{
  icon = icon || card.domElement.querySelector('.cardAuto.cardIcon.cardActionIcon');

  if (
    (fast && !card.isFastForward) ||
    (!fast && card.isFastForward))
    card.toggleFastForward();

  if (collapseOnly)
  {
    card.collapse();

    if (icon.style.transform !== 'rotateZ(0deg)')
      icon.style.transform = 'rotateZ(0deg)';

    return;
  }
  
  if (!card.isCollapsed)
    card.collapse();
  else
    card.expand();

  if (!icon.style.transform)
    icon.style.transform = 'rotateZ(0deg)';
  else if (icon.style.transform === 'rotateZ(0deg)')
    icon.style.transform = 'rotateZ(180deg)';
  else if (icon.style.transform === 'rotateZ(180deg)')
    icon.style.transform = 'rotateZ(0deg)';
}

/** register to several events the app uses
*/
function registerEvents()
{
  mainWindow.on('focus', onfocus);
  mainWindow.on('blur', onblur);
  mainWindow.on('blur', onblur);

  // disable the ability to switch focus between
  // elements using the 'Tab' key
  window.addEventListener('keydown', (event) =>
  {
    if (event.key === 'Tab')
      event.preventDefault();
  });

  window.addEventListener('beforeunload', () =>
  {
    remote.globalShortcut.unregisterAll();
  });
}

function registerBuiltinPhrases()
{
  const quitPhrase = registerPhrase('Quit', undefined, { enter: () => quit() });
  const reloadPhrase = registerPhrase('Reload', undefined, { enter: () => reload() });

  const phrasesPhrase = registerPhrasesPhrase();
  const optionsPhrase = registerOptionsPhrase();
  const extensionsPhrase = registerExtensionsPhrase();

  return Promise.all(
    [
      quitPhrase, reloadPhrase, phrasesPhrase,
      optionsPhrase, extensionsPhrase
    ]);
}

/** gets called when the application gets focus
*/
function onfocus()
{
  emit.focus();
}

/** gets called when the application gets unfocused
*/
function onblur()
{
  if (autoHide)
    mainWindow.hide();
  
  emit.blur();
}

function init()
{
  // create and append the search bar
  initSearchBar();

  // register to several events the app uses
  registerEvents();

  // load npm
  loadNPM();

  // load options
  loadOptions();

  // load all extensions
  loadExtensions();

  // register all builtin phrases
  registerBuiltinPhrases()
    .then(() =>
    {
      // mark the app as ready and
      // emit the ready event
      readyState = true;

      emit.ready();

      onfocus();
    });
}

// initialize the app
init();