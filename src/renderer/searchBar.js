import { on, emit } from './loader.js';

import Card from './card.js';

/** @type { HTMLInputElement }
*/
export let input;

/** create and append the search bar and card-space
*/
export function append()
{
  input = document.createElement('input');
  input.setAttribute('id', 'searchBar');
  document.body.appendChild(input);

  on.focus(onfocus);
  on.blur(onblur);

  input.oninput = oninput;
}

/** gets called every time sulaiman regain focus
*/
function onfocus()
{
  // empty the search bar every time the sulaiman regain focus
  input.focus();
}

/** gets called every time sulaiman regain focus
*/
function onblur()
{
  // empty the search bar
  setInput('');
}

/** gets called when the user changes the input value
*/
function oninput()
{
  // clear all cards connected ti phrases system

  emit.input(input.value);
}

const registeredPhrases = {};

// /**
//  * @type { Object.<string, Card[]> }
//  */
// const phrases = {

// };

/** @param { string } phrase
* @param { Proxy } callback
*/
export function register(phrase, callback)
{
  if (!registeredPhrases[phrase])
    registeredPhrases[phrase] = callback;
  else
    throw new Error('The phrase is already registered');
}

/** @param { string } phrase
*/
export function isRegistered(phrase)
{
  return (registeredPhrases[phrase] !== undefined);
}

/** @param { string } phrase
* @param { Proxy } callback
*/
export function unregister(phrase, callback)
{
  const registered = registeredPhrases[phrase];

  if (registered === callback)
    delete registeredPhrases[phrase];
  else if (registered)
    throw new Error('You cannot unregister what is not yours');
}

/** set the text in the search bar
* @param { string } text
*/
export function setInput(text)
{
  input.value = text;

  oninput();
}

/** set the text in the search bar (if the search bar is empty)
* @param { string } text
*/
export function setPlaceholder(text)
{
  input.placeholder = text;
}