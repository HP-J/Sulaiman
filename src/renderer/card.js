import { themeFunctions as theme, getCaller } from './loader.js';

import { readyState } from './renderer.js';

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
* @property { "nonSelectable" | "Selectable" } [select=nonSelectable]
*/

/** create a new card
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
* elements to the body and control them
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

    /** the card's main element
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

  /** If the elements has a class
  * @param { string } className string of the class name
  */
  containsClass(className)
  {
    return this.domElement.classList.contains(className);
  }

  /** set the element class(es)
  * @param { string } className string of the class name
  */
  setClass(className)
  {
    this.domElement.setAttribute('class', className);
  }

  /** set the element id
  * @param { string } id string of the id
  */
  setId(id)
  {
    this.setAttribute('id', id);
  }

  /** add another card or a element to the card
  * @param { Card | HTMLElement } child
  */
  appendChild(child)
  {
    if (child.isPhrased)
      throw new Error('the card is controlled by the phrase search system');
    else
      this.domElement.appendChild(child.domElement || child);
  }

  /** get a child of the card
  * @param { number } index zero-based index
  */
  getChild(index)
  {
    return this.domElement.children.item(index);
  }
  
  /** remove another card or a element from the card
  * @param { Card | HTMLElement } child
  */
  removeChild(child)
  {
    if (child.isPhrased)
      throw new Error('the card is controlled by the phrase search system');
    else if (this.containsChild(child))
      this.domElement.removeChild(child.domElement || child);
  }

  /** returns true if the card contains a card or a element
  * @param { Card | HTMLElement } child
  */
  containsChild(child)
  {
    return this.domElement.contains(child.domElement || child);
  }

  /** returns the index of a child (card or element)
  * @param { Card | HTMLElement } child
  */
  indexOf(child)
  {
    return Array.prototype.indexOf.call(this.domElement.children, child.domElement || child);
  }

  /** returns the count of children the card has
  */
  get length()
  {
    return this.domElement.children.length;
  }

  /** @param { string } text
  * @param { TextOptions } options
  * @returns { HTMLElement } the text element
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
    if (theme.isFastForward)
      return theme.isFastForward(this);
    else
      return undefined;
  }

  /** fast-forward mode is supposed to skip through transitions and animations
  */
  toggleFastForward()
  {
    if (theme.toggleFastForward)
      theme.toggleFastForward(this);
  }

  /** @param { { type: "ProgressBar", percentage: number } | { type: "Toggle", state: boolean } | { type: "LoadingBar" } | { type:"Picks", picks: string[], defaultPickIndex: number, callback: (pick: string) => void } | { type: "Button" } | { type: "Disabled" } | { type: "Normal" } } type
  * @returns { Card[] | void }
  */
  setType(type)
  {
    this.removeClass('cardProgressBar');
    this.removeClass('cardToggle');
    this.removeClass('cardLoadingBar');
    this.removeClass('cardButton');
    this.removeClass('cardDisabled');

    this.removeClass('cardToggleOn');
    this.removeClass('cardToggleOff');

    if (type.type === 'ProgressBar')
    {
      this.addClass('cardProgressBar');

      type.percentage = type.percentage || 0;

      this.domElement.style.setProperty('--cardPercentage', Math.max(0, Math.min(100, type.percentage)) + '%');
    }
    else if (type.type === 'Toggle')
    {
      this.addClass('cardToggle');

      if (type.state)
        this.addClass('cardToggleOn');
      else
        this.addClass('cardToggleOff');
    }
    else if (type.type === 'Picks')
    {
      const elements = [];

      for (let i = 0; i < type.picks.length; i++)
      {
        const pickCard = createCard({ title: type.picks[i] });

        if (i === type.defaultPickIndex)
          pickCard.addClass('cardPickOn');
        else
          pickCard.addClass('cardPickOff');

        pickCard.domElement.addEventListener('click', () =>
        {
          const newPick = pickCard.domElement;

          // if selecting the same item
          if (pickCard.containsClass('cardPickOn'))
            return;

          // get the current pick element
          const picked = this.domElement.querySelector('.cardPickOn');
    
          // remove highlighting from the old pick
          picked.classList.remove('cardPickOn');
          picked.classList.add('cardPickOff');

          // add highlighting to the new pcik
          newPick.classList.remove('cardPickOff');
          newPick.classList.add('cardPickOn');

          // emits an event with the new pick
          if (type.callback)
            type.callback(type.picks[i]);
        });

        elements.push(pickCard);

        this.appendChild(pickCard);
      }

      // return an array of the elements created
      return elements;
    }
    // 'Button', 'Disabled', 'Loading Bar' and 'Custom Types'
    else if (type.type !== 'Normal')
    {
      this.addClass('card' + type.type);
    }
  }

  get isCollapsed()
  {
    if (theme.isCollapsed)
      return theme.isCollapsed(this);
    else
      return undefined;
  }

  collapse()
  {
    if (theme.collapse)
      theme.collapse(this);
  }

  expand()
  {
    if (theme.expand)
      theme.expand(this);
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
      if (!options.title && titleElem)
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
      if (!options.description && descriptionElem)
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
