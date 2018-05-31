import { join } from 'path';

function init()
{
  console.log(join(__dirname, 'index.js'));
  
  // console.log('register completed, extension started');
}

function oninputCallback(text)
{
  console.log('got a oninput callback with value:' + text);
}