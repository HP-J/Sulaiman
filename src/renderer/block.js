import * as create from './create.js';

export default class Block
{
  constructor()
  {
    /** the block's html element (not recommended to use directly... it has issues)
    * @type { HTMLDivElement }
    */
    this.domElement = document.createElement('div');

    this.domElement.tabIndex = 1;

    const handler =
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
    this.style = new Proxy({}, handler);
  }

  /** clean all the html element childs and start fresh
  */
  clear()
  {
    while (this.domElement.hasChildNodes())
    {
      this.domElement.removeChild(this.domElement.lastChild);
    }
  }

  /** set an attribute
  * @param { string } qualifiedName
  * @param { * } value
  */
  setAttribute(qualifiedName, value)
  {
    this.domElement.setAttribute(qualifiedName, value);
  }

  /** set the html element class(es)
  * @param { string } value string of the classes separated with commas
  */
  setClass(value)
  {
    this.domElement.setAttribute('class', value);
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
    // clean all childs
    // if (this.getClass().indexOf('button') > -1)
    // {
    // this.clear();
    // }

    this.setClass('button');

    const titleElem = create.input(true, 'buttonTitle');
    const descriptionElem = create.input(true, 'buttonDescription');

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
