import * as require from './require.js';

export class Button
{
  /** @param { ButtonMeta } buttonMeta
  */
  constructor(buttonMeta)
  {
    this.domElement = require.button();

    this.title = require.input(true, 'buttonTitle');
    this.description = require.input(true, 'buttonDescription');

    /** @type { HTMLElement }
    */
    this.icon = undefined;

    /** @type { HTMLElement }
    */
    this.action = undefined;
    
    this.domElement.appendChild(this.title);
    this.domElement.appendChild(this.description);

    this.update(buttonMeta);
  }

  /** @param { ButtonMeta } buttonMeta
  */
  update(buttonMeta)
  {
    this.title.value = buttonMeta.title;
    this.description.value = buttonMeta.description;
    
    this.icon = updateIcon(this.domElement, this.icon, buttonMeta.icon, 'buttonIcon');
    this.action = updateIcon(this.domElement, this.action, buttonMeta.action, 'buttonActionIcon');

    /** @param { HTMLButtonElement } dom
    * @param { HTMLElement } oldIcon
    * @param { HTMLElement } newIcon
    */
    function updateIcon(dom, oldIcon, newIcon, className)
    {
      if (newIcon !== undefined)
      {
        newIcon = newIcon.cloneNode(true);

        newIcon.setAttribute('class', className);

        if (oldIcon !== undefined && dom.contains(oldIcon))
          dom.replaceChild(newIcon, oldIcon);
        else
          dom.appendChild(newIcon);
        
        return newIcon;
      }
      else if (oldIcon !== undefined)
      {
        dom.removeChild(oldIcon);

        return undefined;
      }
    }
  }
}

export class ButtonMeta
{
  /** @param { string } title
  * @param { string } description 
  * @param { HTMLElement } icon
  * @param { HTMLElement } action
  */
  constructor(title, description, icon, action)
  {
    this.title = title;
    this.description = description;

    this.icon = icon;
    this.action = action;
  }
}
