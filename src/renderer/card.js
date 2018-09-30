import { getCaller } from './loader.js';

import { readyState } from './renderer.js';

/** @typedef { Object } AutoCardOptions
* @property { string } [title="""]
* @property { string } [description=""]
* @property { HTMLElement } [extensionIcon=null]
* @property { HTMLElement } [actionIcon=null]
*/

/** @typedef { Object } TextOptions
* @property { "Title" | "Description" } [type=Title]
* @property { "Left" | "Right" | "Center" } [align=Left]
* @property { "Medium" | "Small" | "Smaller" | "Big" | "Bigger" } [size=Medium]
* @property { "Normal" | "Bold" | "Light" } [style=Normal]
* @property { "nonSelectable" | "Selectable" } [select=nonSelectable]
*/

/**
* @param { AutoCardOptions } options
*/
export function createCard(options)
{
  if (!readyState)
    throw new Error('the app is not fully loaded yet, use the on.ready event');
  
  const card = new Card(options);

  return card;
}

/**
* @param { AutoCardOptions } options
*/
export function internalCreateCard(options)
{
  return new Card(options);
}

/** A class containing functions and variables to append
* html elements to the body and control them
*/
export default class Card
{
  /**
  * @param { AutoCardOptions } options
  */
  constructor(options)
  {
    const { file, functionName } = getCaller(3);

    if (file !== __filename && (functionName === createCard.name || functionName === internalCreateCard.name))
      throw new TypeError('Illegal Constructor');

    /** the card's main html element
    * (some functions are broken due to issues with the sandbox module,
    * please use the alterative card functions if available instead)
    * @type { HTMLDivElement }
    */
    const domElement = document.createElement('div');

    // make tabIndex a read-only property, it's not
    // recommended that extensions modify default behavior
    Object.defineProperty(domElement, 'tabIndex',
      {
        value: -1,
        writable: false
      });

    this.domElement = domElement;
    
    /** if the card is controlled by a phrase it gets the phrase name, else gets undefined
    * @type { string }
    */
    this.isPhrased = undefined;

    this.auto(options);
  }

  /** set an attribute
  * @param { string } qualifiedName
  * @param { * } value
  */
  setAttribute(qualifiedName, value)
  {
    this.domElement.setAttribute(qualifiedName, value);
  }

  /** add a class from the element
  * @param { string } className string of the class name
  */
  addClass(className)
  {
    if (!this.domElement.classList.contains(className))
      this.domElement.classList.add(className);
  }

  /** remove a class from the element
  * @param { string } className string of the class name
  */
  removeClass(className)
  {
    if (this.domElement.classList.contains(className))
      this.domElement.classList.remove(className);
  }

  /** set the html element id
  * @param { string } id string of the id
  */
  setId(id)
  {
    this.setAttribute('id', id);
  }

  /** add another card or a html element to this card
  * @param { Card | HTMLElement } child
  */
  appendChild(child)
  {
    if (child.isPhrased)
      throw new Error('the card is controlled by the phrase search system');
    else
      this.domElement.appendChild(child.domElement || child);
  }
  
  /** remove another card or a html element from this card
  * @param { Card | HTMLElement } child
  */
  removeChild(child)
  {
    if (child.isPhrased)
      throw new Error('the card is controlled by the phrase search system');
    else
      this.domElement.removeChild(child.domElement || child);
  }

  /** returns true if the card contains a card or a html element
  * @param { Card | HTMLElement } child
  */
  containsChild(child)
  {
    return this.domElement.contains(child.domElement || child);
  }

  /**
  * @param { string } text
  * @param { TextOptions } options
  * @returns { HTMLElement } the text html element
  */
  appendText(text, options)
  {
    options = options || {};

    options.type = options.type || 'Title';

    const textElem = document.createElement('div');

    textElem.classList.add('card' + options.type);

    if (options.align)
      textElem.classList.add('card' + options.align);

    if (options.size)
      textElem.classList.add('card' + options.size);

    if (options.style)
      textElem.classList.add('card' + options.style);

    if (options.select)
      textElem.classList.add('card' + options.select);

    textElem.innerText = text;

    this.domElement.appendChild(textElem);

    return textElem;
  }

  /** returns true if fast-forward mode is enabled or false if disabled
  */
  get isFastForward()
  {
    return this.domElement.classList.contains('cardFastForward');
  }

  /** fast-forward mode is supposed to skip through transitions and animations
  */
  toggleFastForward()
  {
    this.domElement.classList.toggle('cardFastForward');
  }

  /** @param { { type: "ProgressBar", percentage: number } | { type: "Toggle", state: boolean } | { type: "Button" } | { type: "Disabled" } | { type: "Normal" } } type
  */
  setType(type)
  {
    this.removeClass('cardProgressBar');
    this.removeClass('cardToggle');
    this.removeClass('cardButton');
    this.removeClass('cardDisabled');

    this.removeClass('cardToggleOn');
    this.removeClass('cardToggleOff');

    if (type.type === 'ProgressBar')
    {
      this.addClass('cardProgressBar');

      this.domElement.style.setProperty('--cardProgress', (type.percentage || 0) + '%');
    }
    else if (type.type === 'Toggle')
    {
      this.addClass('cardToggle');

      if (type.state)
        this.addClass('cardToggleOn');
      else
        this.addClass('cardToggleOff');
    }
    else if (type.type !== 'Normal')
    {
      this.addClass('card' + type.type);
    }
  }

  get isCollapsed()
  {
    return this.domElement.classList.contains('cardCollapsed');
  }

  collapse()
  {
    /** @param { Card } card
    */
    function collapse(card)
    {
      // get the first line break element in the card
      const lineBreakElement = card.domElement.querySelector('.cardLineBreak');

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
      let element = lineBreakNextElement;

      // loop until there is no more childs
      while (element)
      {
        // if the child has the expanded class, remove it
        if (element.classList.contains('cardChildExpanded'))
          element.classList.remove('cardChildExpanded');

        // add the collapsed class to all the card children
        element.classList.add('cardChildCollapsed');

        // switch to the next child
        element = element.nextElementSibling;
      }
    }

    if (this.isFastForward)
      collapse(this);
    else
      requestAnimationFrame(() => collapse(this));
  }

  expand()
  {
    /** @param { Card } card
    */
    function expand(card)
    {
      // get the first line break element in the card
      const lineBreakElement = card.domElement.querySelector('.cardLineBreak');

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
      let element = lineBreakElement.nextElementSibling;

      while (element)
      {
        // if the child has the collapsed class, remove it
        if (element.classList.contains('cardChildCollapsed'))
          element.classList.remove('cardChildCollapsed');
  
        // add the expanded class to all the card children
        element.classList.add('cardChildExpanded');
  
        // switch to the next child
        element = element.nextElementSibling;
      }
    }

    if (this.isFastForward)
      expand(this);
    else
      requestAnimationFrame(() => expand(this));
  }

  /** adds a new line break to the card
  * @returns { HTMLElement }
  */
  appendLineBreak()
  {
    const lineElem = document.createElement('null');
    lineElem.setAttribute('class', 'cardLineBreak');

    this.domElement.appendChild(lineElem);

    return lineElem;
  }

  /** removes all children and deletes inline styles
  */
  reset()
  {
    while (this.domElement.firstChild)
      this.domElement.removeChild(this.domElement.firstChild);

    this.domElement.style.cssText = '';

    this.setType({ type: 'Normal' });
  }

  /** customize the card with different options that follow the app user's css themes
  * @param { AutoCardOptions } options
  */
  auto(options)
  {
    options = options || {};
    
    this.addClass('card');

    let titleElem = this.domElement.querySelector('.cardAuto.cardTitle');
    let extensionIconElem = this.domElement.querySelector('.cardAuto.cardIcon.cardExtensionIcon');
    let actionIconElem = this.domElement.querySelector('.cardAuto.cardIcon.cardActionIcon');
    let descriptionElem = this.domElement.querySelector('.cardAuto.cardDescription');

    let lineBreakElem = this.domElement.querySelector('.cardAuto.cardLineBreak');

    if (!lineBreakElem)
    {
      lineBreakElem = this.appendLineBreak();

      lineBreakElem.classList.add('cardAuto');
    }

    if (typeof options.title === 'string')
    {
      if (options.title.length <= 0 && titleElem)
      {
        this.removeChild(titleElem);

        titleElem = undefined;
      }
      else if (titleElem)
      {
        titleElem.innerText = options.title;
      }
      else
      {
        titleElem = this.appendText(options.title);

        titleElem.classList.add('cardAuto');
      }
    }

    if (options.extensionIcon !== undefined)
    {
      if (options.extensionIcon === false && extensionIconElem)
      {
        this.domElement.removeChild(extensionIconElem);

        extensionIconElem = undefined;
      }
      else
      {
        options.extensionIcon.classList.add('cardAuto', 'cardIcon', 'cardExtensionIcon');

        this.appendChild(options.extensionIcon);

        if (extensionIconElem)
          this.domElement.replaceChild(options.extensionIcon, extensionIconElem);

        extensionIconElem = options.extensionIcon;
      }
    }
   
    if (options.actionIcon !== undefined)
    {
      if (options.actionIcon === false && actionIconElem)
      {
        this.domElement.removeChild(actionIconElem);

        actionIconElem = undefined;
      }
      else
      {
        options.actionIcon.classList.add('cardAuto', 'cardIcon', 'cardActionIcon');

        this.appendChild(options.actionIcon);

        if (actionIconElem)
          this.domElement.replaceChild(options.actionIcon, actionIconElem);
        
        actionIconElem = options.actionIcon;
      }
    }

    if (typeof options.description === 'string')
    {
      if (options.description.length <= 0 && descriptionElem)
      {
        this.removeChild(descriptionElem);

        descriptionElem = undefined;
      }
      else if (descriptionElem)
      {
        descriptionElem.innerText = options.description;
      }
      else
      {
        descriptionElem = this.appendText(options.description, { type: 'Description' });

        descriptionElem.classList.add('cardAuto');
      }
    }

    if (lineBreakElem && !titleElem && !descriptionElem &&! actionIconElem && !extensionIconElem)
      this.domElement.removeChild(lineBreakElem);
    else
      this.domElement.insertBefore(lineBreakElem, this.domElement.firstElementChild);

    if (descriptionElem)
      this.domElement.insertBefore(descriptionElem, this.domElement.firstElementChild);

    if (actionIconElem)
      this.domElement.insertBefore(actionIconElem, this.domElement.firstElementChild);

    if (extensionIconElem)
      this.domElement.insertBefore(extensionIconElem, this.domElement.firstElementChild);

    if (titleElem)
      this.domElement.insertBefore(titleElem, this.domElement.firstElementChild);
  }
}
