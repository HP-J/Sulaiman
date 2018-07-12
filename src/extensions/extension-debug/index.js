// ! this is a extension to DEBUG and TRY the API
// ! IT SHOULD BE EXCLUDED FROM ANY PACKAGE

import * as ext from 'sulaiman';

// import { join } from 'path';
import { join } from './parts.js';

// TODO test if local modules are hosted outside the proxies
// if the user creates a new script file and required that script
// will it escape the host or not

let block;

function onload()
{
  block = new ext.Block();

  // block.button('hello', 'world', ext.getIcon(join(__dirname, './icons/search.svg')), ext.getIcon(join(__dirname, './icons/expand.svg')));
  
  block.dialogue('title',
    `once I knew a Devil,
    He was really good to me,
    No one has ever been good to me,
    God have sent me to Haven, I hate God.`,
    'yes', 'no', 'maybe');

  // block.notification('title',
  //   `once I knew a Devil,
  //   He was really good to me,
  //   No one has ever been good to me,
  //   God have sent me to Haven, I hate God.`,
  //   'ok');
  
  // block.domElement.style.backgroundColor = 'red';

  block.events.onclick = (ev) =>
  {
    console.log(ev.ctrlKey);
  };

  ext.appendBlock(block);

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

onload();