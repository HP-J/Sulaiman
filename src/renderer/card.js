import { isDOMReady } from './renderer.js';

/** A class containing functions and variables to append
* html elements to the body and control them
*/
export default class Card
{
  /** @typedef { Object } AutoCardOptions
  * @property { string } [title]
  * @property { string } [description]
  * @property { HTMLElement } [extensionIcon]
  * @property { HTMLElement } [actionIcon]
  */

  /** @typedef { Object } TextOptions
  * @property { "Title" | "Description" } [type=Title]
  * @property { "Left" | "Right" | "Center" } [align=Left]
  * @property { "Medium" | "Small" | "Smaller" } [size=Medium]
  * @property { "Normal" | "Bold" | "Light" } [style=Normal]
  */

  /** @typedef { Object } Events
  * @property { (this: HTMLElement, ev: UIEvent) } onabort
  * @property { (this: HTMLElement, ev: FocusEvent) } onblur
  * @property { (this: HTMLElement, ev: Event) } oncanplay
  * @property { (this: HTMLElement, ev: Event) } oncanplaythrough
  * @property { (this: HTMLElement, ev: Event) } onchange
  * @property { (this: HTMLElement, ev: MouseEvent) } onclick
  * @property { (this: HTMLElement, ev: MouseEvent) } oncontextmenu
  * @property { (this: HTMLElement, ev: MouseEvent) } ondblclick
  * @property { (this: HTMLElement, ev: DragEvent) } ondrag
  * @property { (this: HTMLElement, ev: DragEvent) } ondragend
  * @property { (this: HTMLElement, ev: DragEvent) } ondragenter
  * @property { (this: HTMLElement, ev: DragEvent) } ondragleave
  * @property { (this: HTMLElement, ev: DragEvent) } ondragover
  * @property { (this: HTMLElement, ev: DragEvent) } ondragstart
  * @property { (this: HTMLElement, ev: DragEvent) } ondrop
  * @property { (this: HTMLElement, ev: Event) } ondurationchange
  * @property { (this: HTMLElement, ev: Event) } onemptied
  * @property { (this: HTMLElement, ev: Event) } onended
  * @property { (this: HTMLElement, ev: ErrorEvent) } onerror
  * @property { (this: HTMLElement, ev: FocusEvent) } onfocus
  * @property { (this: HTMLElement, ev: InputEvent) } oninput
  * @property { (this: HTMLElement, ev: Event) } oninvalid
  * @property { (this: HTMLElement, ev: KeyboardEvent) } onkeydown
  * @property { (this: HTMLElement, ev: KeyboardEvent) } onkeypress
  * @property { (this: HTMLElement, ev: KeyboardEvent) } onkeyup
  * @property { (this: HTMLElement, ev: UIEvent) } onload
  * @property { (this: HTMLElement, ev: Event) } onloadeddata
  * @property { (this: HTMLElement, ev: Event) } onloadedmetadata
  * @property { (this: HTMLElement, ev: ProgressEvent) } onloadstart
  * @property { (this: HTMLElement, ev: MouseEvent) } onmousedown
  * @property { (this: HTMLElement, ev: MouseEvent) } onmouseenter
  * @property { (this: HTMLElement, ev: MouseEvent) } onmouseleave
  * @property { (this: HTMLElement, ev: MouseEvent) } onmousemove
  * @property { (this: HTMLElement, ev: MouseEvent) } onmouseout
  * @property { (this: HTMLElement, ev: MouseEvent) } onmouseover
  * @property { (this: HTMLElement, ev: MouseEvent) } onmouseup
  * @property { (this: HTMLElement, ev: Event) } onpause
  * @property { (this: HTMLElement, ev: Event) } onplay
  * @property { (this: HTMLElement, ev: Event) } onplaying
  * @property { (this: HTMLElement, ev: Event) } onprogress
  * @property { (this: HTMLElement, ev: Event) } onratechange
  * @property { (this: HTMLElement, ev: Event) } onreset
  * @property { (this: HTMLElement, ev: UIEvent) } onresize
  * @property { (this: HTMLElement, ev: UIEvent) } onscroll
  * @property { (this: HTMLElement, ev: Event) } onseeked
  * @property { (this: HTMLElement, ev: Event) } onseeking
  * @property { (this: HTMLElement, ev: UIEvent) } onselect
  * @property { (this: HTMLElement, ev: Event) } onstalled
  * @property { (this: HTMLElement, ev: Event) } onsubmit
  * @property { (this: HTMLElement, ev: Event) } onsuspend
  * @property { (this: HTMLElement, ev: Event) } ontimeupdate
  * @property { (this: HTMLElement, ev: Event) } ontoggle
  * @property { (this: HTMLElement, ev: Event) } onvolumechange
  * @property { (this: HTMLElement, ev: Event) } onwaiting
  * @property { (this: HTMLElement, ev: WheelEvent) } onwheel
  * @property { (this: HTMLElement, ev: PointerEvent) } ongotpointercapture
  * @property { (this: HTMLElement, ev: PointerEvent) } onlostpointercapture
  * @property { (this: HTMLElement, ev: PointerEvent) } onpointerdown
  * @property { (this: HTMLElement, ev: PointerEvent) } onpointermove
  * @property { (this: HTMLElement, ev: PointerEvent) } onpointerup
  * @property { (this: HTMLElement, ev: PointerEvent) } onpointercancel
  * @property { (this: HTMLElement, ev: PointerEvent) } onpointerover
  * @property { (this: HTMLElement, ev: PointerEvent) } onpointerout
  * @property { (this: HTMLElement, ev: PointerEvent) } onpointerenter
  * @property { (this: HTMLElement, ev: PointerEvent) } onpointerleave
  * @property { (this: HTMLElement, ev: Event) } onbeforecopy
  * @property { (this: HTMLElement, ev: Event) } onbeforecut
  * @property { (this: HTMLElement, ev: Event) } onbeforepaste
  * @property { (this: HTMLElement, ev: ClipboardEvent) } oncopy
  * @property { (this: HTMLElement, ev: ClipboardEvent) } oncut
  * @property { (this: HTMLElement, ev: ClipboardEvent) } onpaste
  * @property { (this: HTMLElement, ev: Event) } onselectstart
  * @property { (this: HTMLElement, ev: Event) } onwebkitfullscreenchange
  * @property { (this: HTMLElement, ev: Event) } onwebkitfullscreenerror
  */

  /**
  * @param { AutoCardOptions } options
  */
  constructor(options)
  {
    /** the card's main html element
    * (some functions are broken due to issues with the sandbox module,
    * please use the alterative card functions if available instead)
    * @type { HTMLDivElement }
    */
    this.domElement = document.createElement('div');

    const styleHandler =
    {
      style: this.domElement.style,
      get: function(target, prop)
      {
        return this.style[prop];
      },
      set: function(obj, prop, value)
      {
        this.style[prop] = value;

        return true;
      }
    };

    /** the css stylesheet of the card
    * @type { CSSStyleDeclaration }
    */
    this.style = new Proxy({}, styleHandler);

    const eventHandler =
    {
      domElement: this.domElement,
      get: function(target, prop)
      {
        return this.domElement[prop];
      },
      set: function(obj, prop, value)
      {
        this.domElement[prop] = value;

        return true;
      }
    };

    /** an object of all available dom events
    * @type { Events }
    */
    this.events = new Proxy({}, eventHandler);

    // adds the card classes and apply some options if defined
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

  progressBar(percentage)
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
    this.removeChild('cardDisabled');
  }

  collapse()
  {
    isDOMReady(() =>
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
    });
  }

  expand()
  {
    isDOMReady(() =>
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
    });
  }

  /** adds a new line break to the card
  */
  appendLineBreak()
  {
    const lineElem = document.createElement('null');
    lineElem.setAttribute('class', 'cardLineBreak');

    this.domElement.appendChild(lineElem);
  }

  /** adds new empty space between lines
  */
  appendLineSeparator()
  {
    const lineElem = document.createElement('null');
    lineElem.setAttribute('class', 'cardLineSeparator');

    this.domElement.appendChild(lineElem);
  }

  /** [Recommended] customize the card with different options that follow the app user's css themes
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

    if (options.description && options.description.length > 0)
      this.appendText(options.description, { type: 'Description' });
      
    this.appendLineBreak();
  }
}
