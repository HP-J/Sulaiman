import * as require from './require.js';

import { visuals } from './theme.js';


export default class Button
{
  constructor()
  {
    this.domElement = require.button();

    this.title = require.input('', 'buttonTitle');
    this.description = require.input('', 'buttonDescription');

    /** @type { SVGSVGElement } */
    this.icon = visuals.next.cloneNode(true);

    /** @type { SVGSVGElement } */
    this.action = visuals.next.cloneNode(true);

    this.icon.setAttribute('class', 'buttonIcon');
    this.action.setAttribute('class', 'buttonAction');

    this.domElement.appendChild(this.title);
    this.domElement.appendChild(this.description);
    this.domElement.appendChild(this.icon);
    this.domElement.appendChild(this.action);
  }
}
