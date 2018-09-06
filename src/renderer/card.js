import { isDOMReady, readyState } from './renderer.js';
import { getCaller } from './loader.js';

/** @typedef { Object } AutoCardOptions
* @property { string } [title]
* @property { string } [description]
* @property { HTMLElement } [extensionIcon]
* @property { HTMLElement } [actionIcon]
*/

/** @typedef { Object } TextOptions
* @property { "Title" | "Description" } [type=Title]
* @property { "Left" | "Right" | "Center" } [align=Left]
* @property { "Medium" | "Small" | "Smaller" | "Big" | "Bigger" } [size=Medium]
* @property { "Normal" | "Bold" | "Light" } [style=Normal]
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

    if (file !== __filename || functionName !== createCard.name)
      throw new TypeError('Illegal Constructor');

    /** the card's main html element
    * (some functions are broken due to issues with the sandbox module,
    * please use the alterative card functions if available instead)
    * @type { HTMLDivElement }
    */
    const domElement = document.createElement('div');

    this.domElement = domElement;

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
    this.domElement.classList.add(className);
  }

  /** remove a class from the element
  * @param { string } className string of the class name
  */
  removeClass(className)
  {
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

  /**
  * @param { string } text
  * @param { TextOptions } options
  * @returns { HTMLElement } the text html element
  */
  appendText(text, options)
  {
    options = options || {};

    options.type = options.type || 'Title';
    options.align = options.align || 'Left';
    options.size = options.size || 'Medium';
    options.style = options.style || 'Normal';

    const textElem = document.createElement('div');

    textElem.setAttribute(
      'class',
      'card' + options.type +
      ' card' + options.align +
      ' card' + options.size +
      ' card' + options.style
    );

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

  /** @param { number } percentage any number between 0 and 100
  */
  setProgressBar(percentage)
  {
    if (percentage < 1 && percentage > 100)
    {
      // remove class
      this.removeClass('cardProgressBar');

      return;
    }

    this.addClass('cardProgressBar');

    this.domElement.style.setProperty('--cardProgress', percentage + '%');
  }

  /** disable the card
  */
  disable()
  {
    this.addClass('cardDisabled');
  }

  /** enable the card
  */
  enable()
  {
    this.removeClass('cardDisabled');
  }

  collapse()
  {
    /** @param { Card } card
    */
    function collapse(card)
    {
      // get the first line break element in the card
      let element = card.domElement.querySelector('.cardLineBreak');

      // if there is no line breaks in the card
      // we can't collapse it
      if (!element)
        return;

      // get the rect of the card and the line break
      const lineBreakRect = element.getBoundingClientRect();
      const cardRect = card.domElement.getBoundingClientRect();

      // get where the collapse should stop at
      card.domElement.style.setProperty(
        '--cardX',
        lineBreakRect.left - cardRect.left + 'px');

      card.domElement.style.setProperty(
        '--cardY',
        lineBreakRect.top - cardRect.top + 'px');

      // if the card has the expanded class, remove it
      if (card.domElement.classList.contains('cardExpanded'))
        card.domElement.classList.remove('cardExpanded');

      // add the collapsed class to the card
      card.domElement.classList.add('cardCollapsed');

      // loop to all the children after the line break
      element = element.nextElementSibling;

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
      isDOMReady(() => collapse(this));
  }

  expand()
  {
    /** @param { Card } card
    */
    function expand(card)
    {
      // get the first line break element in the card
      let element = card.domElement.querySelector('.cardLineBreak');

      // if there is no line breaks in the card
      // we can't expand it
      if (!element)
        return;

      // get the rect of the card
      const cardRect = card.domElement.getBoundingClientRect();

      // get where the expand should start from
      card.domElement.style.setProperty(
        '--cardX',
        cardRect.width + 'px');

      card.domElement.style.setProperty(
        '--cardY',
        cardRect.height + 'px');

      // if the card has the collapsed class, remove it
      if (card.domElement.classList.contains('cardCollapsed'))
        card.domElement.classList.remove('cardCollapsed');
  
      // add the expanded class to the card
      card.domElement.classList.add('cardExpanded');

      // loop to all the children after the line break
      element = element.nextElementSibling;

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
      isDOMReady(() => expand(this));
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

  /** adds new empty space between lines
  * @returns { HTMLElement }
  */
  appendLineSeparator()
  {
    const lineElem = document.createElement('null');
    lineElem.setAttribute('class', 'cardLineSeparator');

    this.domElement.appendChild(lineElem);

    return lineElem;
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

    if (options.title && options.title.length > 0)
    {
      if (titleElem)
      {
        titleElem.innerText = options.title;
      }
      else
      {
        titleElem = this.appendText(options.title);
        titleElem.classList.add('cardAuto');
      }

      this.domElement.insertBefore(titleElem, lineBreakElem);
    }

    if (options.extensionIcon !== undefined)
    {
      options.extensionIcon.classList.add('cardAuto', 'cardExtensionIcon');

      if (extensionIconElem)
        this.domElement.replaceChild(options.extensionIcon, extensionIconElem);
      else
        this.appendChild(options.extensionIcon);

      extensionIconElem = options.extensionIcon;

      this.domElement.insertBefore(extensionIconElem, lineBreakElem);
    }
   
    if (options.actionIcon !== undefined)
    {
      options.actionIcon.classList.add('cardAuto', 'cardActionIcon');

      if (actionIconElem)
        this.domElement.replaceChild(options.actionIcon, actionIconElem);
      else
        this.appendChild(options.actionIcon);
      
      actionIconElem = options.actionIcon;

      this.domElement.insertBefore(actionIconElem, lineBreakElem);
    }

    if (options.description && options.description.length > 0)
    {
      if (descriptionElem)
      {
        descriptionElem.innerText = options.description;
      }
      else
      {
        descriptionElem = this.appendText(options.description, { type: 'Description' });
        descriptionElem.classList.add('cardAuto');
      }

      this.domElement.insertBefore(descriptionElem, lineBreakElem);
    }
  }
}
