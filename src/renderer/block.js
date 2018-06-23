import * as create from './create.js';

import {  currentExtensionPath, runInVM } from './registry.js';

import JSON5 from 'json5';

export default class Block
{
  constructor()
  {
    // /** @type { string } the path of the extension that owns the block
    // */
    // this.owner = currentExtensionPath;

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

    // const testHandler =
    // {
    //   event: this.domElement.onclick,
    //   owner: currentExtensionPath,
    //   get: function(target, prop)
    //   {
    //     return true;
    //   },
    //   set: function(obj, prop, value)
    //   {
    //     // console.log(value.arguments);
    //     // console.log(prop);
    //     // console.log(obj);

    //     // event = (...args) =>
    //     // {
    //     //   runInVM()
    //     // }

    //     return true;
    //   }
    // };

    // this.events = new Proxy({}, testHandler);

    // const testS = JSON.stringify([ 453, '4535' ]);

    // console.log('' + testS);

    // this.events.onclick = (ev) => { console.log('click click'); };

    // this.domElement.onclick = () => { console.log(args); };

    this.domElement.onclick = (ev) =>
    {
      // console.log(ev instanceof Event);
      // console.log(ev.)
      // const json = JSON5.stringify(ev);

      // console.log(json);

      // console.log(JSON5.parse(json));
      // runInVM(currentExtensionPath, 'onclick', JSON.stringify(ev));
    };
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
