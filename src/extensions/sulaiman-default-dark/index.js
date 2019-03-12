import { Card, setPlaceholder, appendStyleDir, storeIcon, setThemeFunctions  } from 'sulaiman';

import { join } from 'path';

/** @param { Card } card
*/
function isFastForward(card)
{
  return card.domElement.classList.contains('cardFastForward');
}

/** @param { Card } card
*/
function toggleFastForward(card)
{
  card.domElement.classList.toggle('cardFastForward');
}

/** @param { Card } card
*/
function isCollapsed(card)
{
  return card.domElement.classList.contains('cardCollapsed');
}

/** @param { Card } card
*/
function collapse(card)
{
  function loop(delay, next)
  {
    setTimeout(() =>
    {
      if (next)
      {
        if (!element.classList.contains('cardCollapsedChild'))
          element.classList.add('cardCollapsedChild');

        index = index + 1;

        // bottom to top
        element = element.previousElementSibling;
      }

      // add the child expand class
      if (!element.classList.contains('cardExpandChild'))
        element.classList.add('cardExpandChild');

      // add the child collapsed class
      if (!element.classList.contains('cardCollapseChild'))
        element.classList.add('cardCollapseChild');

      if (index < childrenToBeCollapsedCount - 1)
      {
        loop(time, true);
      }
      else
      {
        card.domElement.classList.add('cardCollapsed');

        card.pendingAnimation = false;
      }
    }, delay);
  }

  /** first auto line break if no auto line break is found, then find the first normal line break
  * @type { HTMLElement }
  */
  const lineBreakElement = card.domElement.querySelector('.cardLineBreak.cardAuto') || card.domElement.querySelector('.cardLineBreak');

  // if no line breaks are found at all, then we can't know were to collapse to
  if (!lineBreakElement || card.isCollapsed || card.pendingAnimation)
    return;

  // spam-proof
  card.pendingAnimation = true;

  /** the last child on the element, so we can go from bottom to top
  * @type { HTMLElement }
  */
  let element = card.domElement.lastElementChild;

  let index = 0;
  const childrenToBeCollapsedCount = card.length - card.indexOf(lineBreakElement);
  
  // the time of the animation divided by the count of children
  const time = (card.isFastForward) ? 0 : 500 / childrenToBeCollapsedCount;

  // send the animation duration to css
  card.domElement.style.setProperty('--cardChildAnimationDuration', time + 'ms');

  // start the loop, collapse the first child without any delay
  loop(0);
}

/** @param { Card } card
*/
function expand(card)
{
  function loop(delay, next)
  {
    setTimeout(() =>
    {
      if (next)
      {
        index = index + 1;
        
        // top to bottom
        element = element.nextElementSibling;
      }

      if (element.classList.contains('cardCollapsedChild'))
        element.classList.remove('cardCollapsedChild');

      if (element.classList.contains('cardCollapseChild'))
        element.classList.remove('cardCollapseChild');
      
      if (index < childrenToBeExpandedCount - 1)
      {
        loop(time, true);
      }
      else
      {
        card.domElement.classList.remove('cardCollapsed');

        card.pendingAnimation = false;
      }
    }, delay);
  }

  /** first auto line break if no auto line break is found, then find the first normal line break
  * @type { HTMLElement }
  */
  const lineBreakElement = card.domElement.querySelector('.cardLineBreak.cardAuto') || card.domElement.querySelector('.cardLineBreak');

  // if no line breaks are found at all, then we can't know were to collapse to
  // if the isn't collapsed, then why would we expand it
  if (!lineBreakElement || !card.isCollapsed || card.pendingAnimation)
    return;

  // spam-proof
  card.pendingAnimation = true;

  /** the first child to be expanded on the element, from top to bottom
  * @type { HTMLElement }
  */
  let element = lineBreakElement;

  let index = 0;
  const childrenToBeExpandedCount = card.length - card.indexOf(lineBreakElement);
  
  // the time of the animation divided by the count of children
  const time = (card.isFastForward) ? 0 : 500 / childrenToBeExpandedCount;

  // send the animation duration to css
  card.domElement.style.setProperty('--cardChildAnimationDuration', time + 'ms');

  // start the loop, expand the first child without any delay
  loop(0);
}

// set the default search bar placeholder
setPlaceholder('Search');

// append the theme stylesheets
appendStyleDir(join(__dirname, 'styles'));

// store the arrow icon
storeIcon(join(__dirname, '/icons/arrow.svg'), 'arrow');

// set the theme functions
setThemeFunctions(isFastForward, toggleFastForward, isCollapsed, collapse, expand);