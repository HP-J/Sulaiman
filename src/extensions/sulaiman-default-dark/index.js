import * as sulaiman from 'sulaiman';

import { join } from 'path';

/** @param { sulaiman.Card } card
*/
function isFastForward(card)
{
  return card.domElement.classList.contains('cardFastForward');
}

/** @param { sulaiman.Card } card
*/
function toggleFastForward(card)
{
  card.domElement.classList.toggle('cardFastForward');
}

/** @param { sulaiman.Card } card
*/
function isCollapsed(card)
{
  return card.domElement.classList.contains('cardCollapsed');
}

/** @param { sulaiman.Card } card
*/
function collapse(card)
{
  if (isFastForward(card))
    setCollapse(card);
  else
    sulaiman.on.domReady(() => setCollapse(card));
}

/** @param { sulaiman.Card } card
*/
function expand(card)
{
  if (isFastForward(card))
    setExpand(card);
  else
    sulaiman.on.domReady(() => setExpand(card));
}

/** @param { sulaiman.Card } card
*/
function setCollapse(card)
{
  // get the first line break element in the card
  const lineBreakElement = card.domElement.querySelector('.cardLineBreak.cardAuto') || card.domElement.querySelector('.cardLineBreak');

  const lineBreakNextElement = lineBreakElement.nextElementSibling;
  const lineBreakPreviousElement = lineBreakElement.previousElementSibling;
     
  if (!lineBreakElement || !lineBreakNextElement || !lineBreakPreviousElement)
    return;
     
  const lineBreakRect = lineBreakElement.getBoundingClientRect();

  const firstElementRect = card.domElement.firstElementChild.getBoundingClientRect();
  const lastElementRect = card.domElement.lastElementChild.getBoundingClientRect();

  const nextElementRect = lineBreakNextElement.getBoundingClientRect();
  const previousElementRect = lineBreakPreviousElement.getBoundingClientRect();

  const lastLineBreakElementRect = card.appendLineBreak().getBoundingClientRect();
  card.domElement.removeChild(card.domElement.lastChild);
     
  const topMargin = (nextElementRect.top - lineBreakRect.bottom);
  const bottomMargin = (lastLineBreakElementRect.top - lastElementRect.bottom);
     
  // const cardRect = card.domElement.getBoundingClientRect();
  // const topPadding = firstElementRect.top - cardRect.top;
  // const bottomPadding = cardRect.height - (lastLineBreakElementRect.bottom - cardRect.top);

  const top = (previousElementRect.bottom - firstElementRect.top) + (bottomMargin + topMargin);
  const height = (lastElementRect.bottom - firstElementRect.top) + bottomMargin + topMargin;

  card.domElement.style.setProperty(
    '--cardY',
    top + 'px');

  card.domElement.style.setProperty(
    '--cardHeight',
    height + 'px');

  // if the card has the expanded class, remove it
  if (card.domElement.classList.contains('cardExpanded'))
    card.domElement.classList.remove('cardExpanded');

  // add the collapsed class to the card
  card.domElement.classList.add('cardCollapsed');

  // loop to all the children after the line break
  let nextElementSibling = lineBreakNextElement;

  // loop until there is no more childs
  while (nextElementSibling)
  {
    // if the child has the expanded class, remove it
    if (nextElementSibling.classList.contains('cardChildExpanded'))
      nextElementSibling.classList.remove('cardChildExpanded');

    // add the collapsed class to all the card children
    nextElementSibling.classList.add('cardChildCollapsed');

    // switch to the next child
    nextElementSibling = nextElementSibling.nextElementSibling;
  }
}

/** @param { sulaiman.Card } card
*/
function setExpand(card)
{
  // get the first line break element in the card
  const lineBreakElement = card.domElement.querySelector('.cardLineBreak.cardAuto') || card.domElement.querySelector('.cardLineBreak');

  const lineBreakNextElement = lineBreakElement.nextElementSibling;
  const lineBreakPreviousElement = lineBreakElement.previousElementSibling;
  
  if (!lineBreakElement || !lineBreakNextElement || !lineBreakPreviousElement)
    return;
  
  const lineBreakRect = lineBreakElement.getBoundingClientRect();

  const firstElementRect = card.domElement.firstElementChild.getBoundingClientRect();
  const lastElementRect = card.domElement.lastElementChild.getBoundingClientRect();

  const nextElementRect = lineBreakNextElement.getBoundingClientRect();
  const previousElementRect = lineBreakPreviousElement.getBoundingClientRect();

  const lastLineBreakElementRect = card.appendLineBreak().getBoundingClientRect();
  card.domElement.removeChild(card.domElement.lastChild);
  
  const topMargin = (nextElementRect.top - lineBreakRect.bottom);
  const bottomMargin = (lastLineBreakElementRect.top - lastElementRect.bottom);
  
  // const cardRect = card.domElement.getBoundingClientRect();
  // const topPadding = firstElementRect.top - cardRect.top;
  // const bottomPadding = cardRect.height - (lastLineBreakElementRect.bottom - cardRect.top);

  const top = (previousElementRect.bottom - firstElementRect.top) + (bottomMargin + topMargin);
  const height = (lastElementRect.bottom - firstElementRect.top) + bottomMargin + topMargin;

  card.domElement.style.setProperty(
    '--cardY',
    top + 'px');

  card.domElement.style.setProperty(
    '--cardHeight',
    height + 'px');

  // if the card has the collapsed class, remove it
  if (card.domElement.classList.contains('cardCollapsed'))
    card.domElement.classList.remove('cardCollapsed');

  // add the expanded class to the card
  card.domElement.classList.add('cardExpanded');

  // loop to all the children after the line break
  let nextElementSibling = lineBreakElement.nextElementSibling;

  while (nextElementSibling)
  {
    // if the child has the collapsed class, remove it
    if (nextElementSibling.classList.contains('cardChildCollapsed'))
      nextElementSibling.classList.remove('cardChildCollapsed');
 
    // add the expanded class to all the card children
    nextElementSibling.classList.add('cardChildExpanded');
 
    // switch to the next child
    nextElementSibling = nextElementSibling.nextElementSibling;
  }
}

// set the default search bar placeholder
sulaiman.setPlaceholder('Search');

// append the theme stylesheets
sulaiman.appendStyleDir(join(__dirname, 'styles'));

// store the default icon set
sulaiman.storeIcon(join(__dirname, '/icons/arrow.svg'), 'arrow');
sulaiman.storeIcon(join(__dirname, '/icons/more.svg'), 'more');
sulaiman.storeIcon(join(__dirname, '/icons/question.svg'), 'question');

sulaiman.storeIcon(join(__dirname, '/icons/settings.svg'), 'settings');
sulaiman.storeIcon(join(__dirname, '/icons/share.svg'), 'share');

// set the theme functions
sulaiman.setThemeFunctions(isFastForward, toggleFastForward,isCollapsed, collapse, expand);