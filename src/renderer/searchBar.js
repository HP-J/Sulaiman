import { on, emit, registeredPhrases } from './loader.js';

import Card from './card.js';

/** @type { HTMLInputElement }
*/
export let inputElem;

/** create and append the search bar and card-space
*/
export function appendSearchBar()
{
  inputElem = document.createElement('input');
  inputElem.setAttribute('id', 'searchBar');
  document.body.appendChild(inputElem);

  on.focus(focus);
  on.blur(blur);

  inputElem.oninput = oninput;
}

/** gets called every time sulaiman regain focus
*/
function focus()
{
  // empty the search bar every time the sulaiman regain focus
  inputElem.focus();
}

/** gets called every time sulaiman regain focus
*/
function blur()
{
  // empty the search bar
  setInput('');
}

/** gets called when the user changes the input value
*/
function oninput()
{
  let input = standard(inputElem.value);

  emit.input(input);

  // split to array of words
  input = input.split(/\s/);
  
  for (let phrase in registeredPhrases)
  {
  // split to array of words
    phrase = phrase.split(/\s/);

    // array of the arguments passed the the phrase
    const args = input.slice(phrase.length);

    // array of input words that match the number of words in the phrase
    const query = input.slice(0,  phrase.length);

    let overallPercentage = 0;

    for (let i = 0; i < query.length; i++)
    {
      if (phrase[i].startsWith(query[i]))
      {
        const percentage = (((100 * query[i].length) / phrase[i].length) / phrase.length);

        overallPercentage += percentage;
      }
    }

    setTimeout(() =>
    {
      // add to auto-complete highlight the input from the phrase
      // emit a callback if exists with the args (if the phrase is fully written)
      
      console.log(phrase + ': ' + overallPercentage);
    }, 100 - overallPercentage);
  }
}

/** update a string to be the standard the app uses for searching
* @param { string } s the string you want to update
*/
export function standard(s)
{
  // to lower case, we don't want any trouble with case insensitivity

  // replace any newlines or extra whitespace with only one space,
  // so we can split words correctly

  // remove any whitespace from the beginning and the ending of the string,
  // just to make sure to get the expected result

  return s.toLowerCase().replace(/\s+|\n/g, ' ').trim();
}

/** set the text in the search bar
* @param { string } text
*/
export function setInput(text)
{
  inputElem.value = text;

  oninput();
}

/** set the text in the search bar (if the search bar is empty)
* @param { string } text
*/
export function setPlaceholder(text)
{
  inputElem.placeholder = text;
}