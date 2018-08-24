// ! this is a extension to DEBUG and TRY the API
// ! IT SHOULD BE EXCLUDED FROM ANY PACKAGE

import * as sulaiman from 'sulaiman';

import { join } from 'path';

let card;

function onload()
{
  card = new sulaiman.Card();

  // card.button(
  //   'hello',
  //   'world',
  //   // undefined,
  //   ext.getIcon(join(__dirname, './icons/search.svg')),
  //   ext.getIcon(join(__dirname, './icons/expand.svg'))
  // );
  
  // card.dialogue('title',
  //   `there are few words that do justice to this villainy,
  //   and I think it can only hasten that regime's departure.`,
  //   '1', '2', '3');

  // card.notification('title',
  //   `once I knew a Devil,
  //   He was really good to me,
  //   No one has ever been good to me,
  //   God have sent me to Haven, I hate God.`,
  //   'ok');
  
  // card.domElement.style.backgroundColor = 'red';

  card.events.onclick = (ev) =>
  {
    console.log(ev.ctrlKey);
  };

  sulaiman.appendChild(card);

  // ext.appendStyle(join(__dirname, './style.css'));
  // ext.removeStyle(join(__dirname, './style.css'));

  // ext.clipboard.writeText('hello world');

  // ext.onSearchBarInput(onSearchBarInput);
}

function onSearchBarInput(text)
{
  // if (text === 'g')
  //   ext.setPlaceholder('google');
  // if (text === 'ga')
  //   ext.setPlaceholder('gamely');

  // console.log('onSearchBarInput: ' + text);
}

// onload();