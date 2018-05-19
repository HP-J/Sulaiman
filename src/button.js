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
    
    this.icon = updateVisual(this.domElement, this.icon, buttonMeta.icon, 'buttonIcon');
    this.action = updateVisual(this.domElement, this.action, buttonMeta.action, 'buttonAction');

    /** @param { HTMLButtonElement } dom
    * @param { HTMLElement } oldVisual
    * @param { HTMLElement } newVisual
    */
    function updateVisual(dom, oldVisual, newVisual, className)
    {
      if (newVisual !== undefined)
      {
        newVisual = newVisual.cloneNode(true);
        newVisual.setAttribute('class', className);

        if (oldVisual !== undefined && dom.contains(oldVisual))
          dom.replaceChild(newVisual, oldVisual);
        else
          dom.appendChild(newVisual);
        
        return newVisual;
      }
      else if (oldVisual !== undefined)
      {
        dom.removeChild(oldVisual);

        return undefined;
      }
    }
  }
}

export class ButtonMeta
{
  /** @param { string } title
  * @param { string } description 
  * @param { SVGSVGElement } icon
  * @param { SVGSVGElement } action
  */
  constructor(title, description, icon, action)
  {
    this.title = title;
    this.description = description;

    this.icon = icon;
    this.action = action;
  }
}
