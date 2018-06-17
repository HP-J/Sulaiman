import * as create from './create.js';

export default class Block
{
  constructor()
  {
    /** the block's html element (not recommended to use directly... it has issues)
    * @type { HTMLDivElement }
    */
    this.domElement = document.createElement('div');

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
  * @param { string | HTMLElement } icon
  * @param { string | HTMLElement } actionIcon
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

    //  this.icon = updateIcon(this.domElement, this.icon, buttonMeta.icon, 'buttonIcon');
    //  this.action = updateIcon(this.domElement, this.action, buttonMeta.action, 'buttonActionIcon');

    // /** @param { HTMLButtonElement } dom
    //     * @param { HTMLElement } oldIcon
    //     * @param { HTMLElement } newIcon
    //     */
    // function updateIcon(dom, oldIcon, newIcon, className)
    // {
    //   if (newIcon !== undefined)
    //   {
    //     newIcon = newIcon.cloneNode(true);

    //     newIcon.setAttribute('class', className);

    //     if (oldIcon !== undefined && dom.contains(oldIcon))
    //       dom.replaceChild(newIcon, oldIcon);
    //     else
    //       dom.appendChild(newIcon);
        
    //     return newIcon;
    //   }
    //   else if (oldIcon !== undefined)
    //   {
    //     dom.removeChild(oldIcon);

    //     return undefined;
    //   }
    // }
  }
}
