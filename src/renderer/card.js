import { isDOMReady } from './renderer.js';
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
    const { file, functionName } = getCaller();

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

  /** reset the card
  */
  reset()
  {
    // remove all children
    while (this.domElement.hasChildNodes())
    {
      this.domElement.removeChild(this.domElement.lastChild);
    }

    // remove all classes
    this.domElement.className = '';

    // remove id
    this.domElement.id = '';

    // remove the style
    this.domElement.style.cssText = '';
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
    this.domElement.appendChild(child.domElement || child);
  }
  
  /** remove another card or a html element from this card
  * @param { Card | HTMLElement } child
  */
  removeChild(child)
  {
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
  enableFastForward()
  {
    this.addClass('cardFastForward');
  }

  /** fast-forward mode is supposed to skip through transitions and animations
  */
  disableFastForward()
  {
    this.removeClass('cardFastForward');
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
    function collapse()
    {
      // get the first line break element in the card
      let element = this.domElement.querySelector('.cardLineBreak');

      // if there is no line breaks in the card
      // we can't collapse it
      if (!element)
        return;

      // get the rect of the card and the line break
      const lineBreakRect = element.getBoundingClientRect();
      const cardRect = this.domElement.getBoundingClientRect();

      // get where the collapse should stop at
      this.domElement.style.setProperty(
        '--cardX',
        lineBreakRect.left - cardRect.left + 'px');

      this.domElement.style.setProperty(
        '--cardY',
        lineBreakRect.top - cardRect.top + 'px');

      // if the card has the expanded class, remove it
      if (this.domElement.classList.contains('cardExpanded'))
        this.domElement.classList.remove('cardExpanded');

      // add the collapsed class to the card
      this.domElement.classList.add('cardCollapsed');

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
      collapse();
    else
      isDOMReady(collapse);
  }

  expand()
  {
    function expand()
    {
      // get the first line break element in the card
      let element = this.domElement.querySelector('.cardLineBreak');

      // if there is no line breaks in the card
      // we can't expand it
      if (!element)
        return;

      // get the rect of the card
      const cardRect = this.domElement.getBoundingClientRect();

      // get where the expand should start from
      this.domElement.style.setProperty(
        '--cardX',
        cardRect.width + 'px');

      this.domElement.style.setProperty(
        '--cardY',
        cardRect.height + 'px');

      // if the card has the collapsed class, remove it
      if (this.domElement.classList.contains('cardCollapsed'))
        this.domElement.classList.remove('cardCollapsed');
  
      // add the expanded class to the card
      this.domElement.classList.add('cardExpanded');

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
      expand();
    else
      isDOMReady(expand);
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
    // undefined protection
    options = options || {};

    this.reset();

    this.addClass('card');

    if (options.title && options.title.length > 0)
      this.appendText(options.title);

    if (options.extensionIcon !== undefined)
      this.appendChild(options.extensionIcon);
   
    if (options.actionIcon !== undefined)
      this.appendChild(options.actionIcon);

    this.appendLineBreak();

    if (options.description && options.description.length > 0)
      this.appendText(options.description, { type: 'Description' });
  }
}
