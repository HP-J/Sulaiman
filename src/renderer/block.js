import { getInput } from './theme.js';

import {  currentExtensionPath, runFunction } from './registry.js';

export default class Block
{
  constructor()
  {
    /** the block's html element (some functions like events and style are disabled by the sandbox, please use the block functions instead)
    * @type { HTMLDivElement }
    */
    this.domElement = document.createElement('div');

    this.domElement.tabIndex = 1;

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

    /** the css stylesheet of the block
    * @type { CSSStyleDeclaration }
    */
    this.style = new Proxy({}, styleHandler);

    const eventHandler =
    {
      domElement: this.domElement,
      path: currentExtensionPath,
      get: function(target, eventName)
      {
        if (this.domElement[eventName] !== null && this.domElement[eventName] !== undefined)
          return true;
        else
          return undefined;
      },
      /**
       * @param { Function } func
       */
      set: function(obj, eventName, func)
      {
        const path = this.path;

        if (!func.name || func.name === '')
          return false;

        this.domElement[eventName] = function(ev)
        {
          runFunction(path, func.name, this, ev);
        };

        return true;
      }
    };

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

    /** an object of all available dom events
    * @type { Events }
    */
    this.events = new Proxy({}, eventHandler);
  }

  /** clean all the html element childs and start fresh
  */
  clear()
  {
    // remove all children
    while (this.domElement.hasChildNodes())
    {
      this.domElement.removeChild(this.domElement.lastChild);
    }

    // remove all classes and ids
    this.setClass('');
    this.setId('');

    // remove the css text
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

  /** set the html element class
  * @param { string } className string of the class name
  */
  setClass(className)
  {
    this.domElement.setAttribute('class', className);
  }

  /** set the html element id
  * @param { string } id string of the id
  */
  setId(id)
  {
    this.domElement.setAttribute('id', id);
  }

  /** get the html element class(es)
  * @returns { string } string of the classes separated with commas
  */
  getClass()
  {
    return this.domElement.getAttribute('class');
  }

  /**
  * @param { string } title
  * @param { string } description
  * @param { HTMLElement } icon
  * @param { HTMLElement } actionIcon
  */
  itsButton(title, description, icon, actionIcon)
  {
    this.clear();

    this.setClass('button');

    const titleElem = getInput(true, 'buttonTitle');
    const descriptionElem = getInput(true, 'buttonDescription');

    titleElem.value = title;
    descriptionElem.value = description;

    this.domElement.appendChild(titleElem);
    this.domElement.appendChild(descriptionElem);

    if (icon !== undefined)
    {
      icon.setAttribute('class', 'buttonIcon');
      icon.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      this.domElement.appendChild(icon);
    }

    if (actionIcon !== undefined)
    {
      actionIcon.setAttribute('class', 'buttonActionIcon');
      actionIcon.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      this.domElement.appendChild(actionIcon);
    }
  }
}
