import { remote } from 'electron';

import { join } from 'path';

import { getIcon } from './api.js';

import { loadExtensions, emit } from './loader.js';
import { autoHide, loadOptions, registerOptionsPrefix } from './options.js';
import { initSearchBar } from './search.js';

/** @typedef { import('./card.js').default } Card
*/

/** @typedef { import('./prefix.js').default } Prefix
*/

const { mainWindow } = remote.require(join(__dirname, '../main/window.js'));

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

function registerBuiltinPrefixes()
{
  registerOptionsPrefix();
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

  // load options
  loadOptions();

  // register all builtin prefixes
  registerBuiltinPrefixes();

  // load all extensions
  loadExtensions();

  onfocus();
}

// initialize the app
init();