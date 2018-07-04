import * as ext from 'sulaiman';

import { join } from 'path';

// TODO finish documenting and move it to a new repository

// TODO test if local modules are hosted outside the proxies
// if the user creates a new script file and required that script
// will it escape the host or not

function onload()
{
  const block = new ext.Block();
  
  block.itsButton('hello', 'world', ext.getIcon(join(__dirname, './icons/search.svg')), ext.getIcon(join(__dirname, './icons/expand.svg')));
  
  // block.element.style.backgroundColor = 'red';

  ext.appendBlock(block);

  // ext.appendStyle(join(__dirname, './page-alt.css'));
  // ext.removeStyle(join(__dirname, './page-alt.css'));

  // ext.clipboard.writeText('hello world');

  // block.element.onclick = (ev) =>
  // {
  //   console.log(ev.ctrlKey);
  // };

  // ext.onSearchInput(onSearchInput);
}

function onSearchInput(text)
{
  // if (text === 'g')
  //   ext.setPlaceholder('google');
  // if (text === 'ga')
  //   ext.setPlaceholder('gamely');

  // console.log('onSearchInput: ' + text);
}

onload();