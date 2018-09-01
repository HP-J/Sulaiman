// ! this is a extension to DEBUG and TRY the API
// ! IT SHOULD BE EXCLUDED FROM ANY PACKAGE

import * as sulaiman from 'sulaiman';

const card = sulaiman.createCard({ title: 'Hello' });

card.domElement.style.backgroundColor = 'red';

sulaiman.appendChild(card);

// import * as sulaiman from '../../../';

// import { join } from 'path';

// console.log('test for a special extension');

// const card = new sulaiman.Card();

// card.init();

// const text = card.appendText('Hello');

// card.domElement.style.backgroundColor = 'red';

// sulaiman.appendChild(card);

// const domElement = document.createElement('div');

// domElement.classList.add('card');

// domElement.style.backgroundColor = 'red';

// sulaiman.appendChild(domElement);