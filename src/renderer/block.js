export default class Block
{
  constructor()
  {
    /** the block's html element (not recommended to use directly)
    * @type { HTMLElement }
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

    /** @type { CSSStyleDeclaration }
    */
    this.style = new Proxy({}, handler);
  }

  clear()
  {
    // TODO clear all childs of dom element
  }

  setAttribute(qualifiedName, value)
  {
    this.domElement.setAttribute(qualifiedName, value);
  }

  setClass(name)
  {
    this.domElement.setAttribute('class', name);
  }

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
    // clearing the element every time we update button is not efficient
    // this.clear();

    //  this.title.value = buttonMeta.title;
    //  this.description.value = buttonMeta.description;

    
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
