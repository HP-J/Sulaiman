/** A class containing functions and variables to append
* html elements to the body and control them
*/
export default class Block
{
  /** @typedef { Object } AutoBlockOptions
  * @property { string } [title]
  * @property { string } [description]
  * @property { HTMLElement } [extensionIcon]
  * @property { HTMLElement } [actionIcon]
  */

  /** @typedef { Object } TextOptions
  * @property { "Title" | "Description" } [type=Title]
  * @property { "Normal" | "Small" | "Smaller" } [size=Normal]
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
  * @param { AutoBlockOptions } options
  */
  constructor(options)
  {
    /** the block's main html element
    * (some functions are broken due to issues with the sandbox module,
    * please use the alterative block functions if available instead)
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

    // adds the block classes and apply some options if defined
    this.auto(options);
  }

  /** reset the block
  */
  reset()
  {
    // remove all children
    while (this.domElement.hasChildNodes())
    {
      this.domElement.removeChild(this.domElement.lastChild);
    }

    // remove all classes
    this.setClass('');

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

  /** set the html element class
  * @param { string } className string of the class name
  */
  setClass(className)
  {
    this.setAttribute('class', className);
  }

  /** set the html element id
  * @param { string } id string of the id
  */
  setId(id)
  {
    this.setAttribute('id', id);
  }

  /** add a block or a html element to the block
  * @param { Block | HTMLElement } child
  */
  appendChild(child)
  {
    this.domElement.appendChild(child.domElement || child);
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
    options.size = options.size || 'Normal';

    const textElem = document.createElement('div');

    textElem.setAttribute(
      'class',
      'block' + options.type +
      ' block' + options.size
    );

    textElem.innerText = text;
    this.domElement.appendChild(textElem);

    return textElem;
  }

  /**
  * @param { HTMLElement } icon
  * @returns { HTMLElement } the line break html element
  */
  appendIcon(icon)
  {
    icon.setAttribute('class', 'blockIcon');

    this.domElement.appendChild(icon);

    return icon;
  }

  /** adds a new line break to the block
  */
  appendLineBreak()
  {
    const lineElem = document.createElement('null');
    lineElem.setAttribute('class', 'blockLineBreak');

    this.domElement.appendChild(lineElem);
  }

  /** adds new empty space between lines
  */
  appendLineSeparator()
  {
    const lineElem = document.createElement('null');
    lineElem.setAttribute('class', 'blockLineSeparator');

    this.domElement.appendChild(lineElem);
  }

  /** [Recommended] customize the block with different options that follow the app user's css themes
  * @param { AutoBlockOptions } options
  */
  auto(options)
  {
    // undefined protection
    options = options || {};

    this.reset();

    this.setClass('block');

    if (options.title && options.title.length > 0)
      this.appendText(options.title);

    if (options.extensionIcon !== undefined)
      this.appendIcon(options.extensionIcon);
   
    if (options.actionIcon !== undefined)
      this.appendIcon(options.actionIcon);

    if (options.description && options.description.length > 0)
      this.appendText(options.description, { type: 'Description' });

    this.appendLineBreak();
  }
}
