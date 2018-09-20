import { on } from './loader.js';

import Card, { createCard } from './card.js';

/** @type { HTMLInputElement }
*/
let inputElement;

/** @type { HTMLDivElement }
*/
let suggestionsElement;

let lastInput = '';

/** create and append the search bar and card-space
*/
export function appendSearchBar()
{
  inputElement = document.createElement('input');
  inputElement.setAttribute('class', 'searchBar');
  document.body.appendChild(inputElement);

  suggestionsElement = document.createElement('div');
  suggestionsElement.setAttribute('class', 'suggestions');
  document.body.appendChild(suggestionsElement);

  updateSuggestionsCount(0);

  inputElement.oninput = oninput;
  inputElement.onkeydown = onkeydown;
  inputElement.onfocus = inputElement.onblur = toggleSuggestionElement;

  on.focus(focus);
  on.blur(blur);
  on.ready(oninput);

  compare();
}

/** gets called every time sulaiman regain focus
*/
function focus()
{
  inputElement.focus();
}

/** clear the search bar
*/
function clear()
{
  inputElement.value = '';

  oninput();
}

/** gets called every time sulaiman loses focus
*/
function blur()
{
  // clear the search bar on sulaiman blur
  if (!process.env.DEBUG)
    clear();
}

const registeredPhrases = {};

/** gets called when the user changes the input value
*/
function oninput()
{
  // const input = standard(inputElement.value);

  // if (input === lastInput)
  //   return;

  // lastInput = input;

  // if there is a active card, remove it from dom

  // if input string is empty, update count to 0 and return
  // else scroll to top of the body `window.scroll` and
  // remove all suggestions item from the suggestions element
  // reset selected item to 0
  // if (!input)
  // {

  // }
    
  // then search phrase
  // searchPhrases(getInputRegex(input));
}

function search(input)
{
  // for (const phrase in registeredPhrases)
  // {
  //   compare(input, phrase);
  // }
}

/** compares two strings and returns percentage, written and remaining characters
* @param { RegExp } regex
* @param { string } searchable
*/
function compare(regex, searchable)
{
  // this function is based on the current search regex
  // it needs to be updated every time the regex changes
  
  // if the searchable isn't an empty string
  if (!searchable)
    return undefined;
  
  const searchableWords = searchable.split(' ');
  const match = regex.exec(searchable);

  if (!match)
    return undefined;
  
  // create an element for the suggestion item
  const element = document.createElement('div');
  
  element.setAttribute('class', 'suggestionsItem');

  const compareTotal = searchableWords.length * 100;
  let comparePercentage = 0;

  let isWritten = false;

  for (let i = 1; i < match.length; i++)
  {
    // the current piece of the match string
    const piece = match[i];

    // if is piece is written in the input string
    if (isWritten)
    {
      // the pervious piece of the word, if exists
      let pervious = match[i - 1].split(' ');
      pervious = pervious[pervious.length - 1];

      // the next piece of the word, if exists
      const next = match[i + 1].split(' ')[0];
      
      // the entire word
      const word = pervious + piece + next;

      // the word completion percentage
      comparePercentage += (piece.length / word.length) * 100;
    }

    // create a text element with the piece
    const textElement = document.createElement('div');
    
    textElement.innerText = piece;
    
    // if it's written
    if (isWritten)
      // mark it as written text
      textElement.setAttribute('class', 'suggestionsItemWrittenText');
    
    // add it to the suggestion item element
    element.appendChild(textElement);

    // flip the written boolean
    isWritten = !isWritten;
  }

  // reset regex last index
  regex.lastIndex = 0;

  return { total: compareTotal, percentage: comparePercentage, element: element };
}

/** @param {string} input
*/
function getInputRegex(input)
{
  // picks everything
  const uncut = '([\\s\\S]*)';

  const regexString = input.split(' ').map(
    (string, i, array) =>
    {
      string = '(' + escapeRegExp(string) + '+?)';

      // pick everything before the first match as a separate group
      if (i <= 0)
        string = uncut + string;
        
      // pick everything after the last match as a separate group
      if (i >= array.length - 1)
        string = string + uncut;

      return string;
    }
  );

  // join(uncut) picks everything between matches
  return new RegExp(regexString.join(uncut), 'ig');
}

/** replaces the unescapable characters in a regex with escapable characters
* @param { string } s the string you want to update
*/
function escapeRegExp(s)
{
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** update a string to be the standard the app uses for searching
* @param { string } s the string you want to update
*/
function standard(s)
{
  // replace any newlines or extra whitespace with only one space,
  // so we can split words correctly

  // remove any unnecessary whitespace from the beginning and the ending of the string,
  // just to make sure to get the expected result

  return s.replace(/\s+|\n/g, ' ').trim();
}

/** toggle the css class 'suggestionsActive' on the suggestions list element
 */
function toggleSuggestionElement()
{
  suggestionsElement.classList.toggle('suggestionsActive');
}

/** sets the css property '--suggestions-count'
* @param { number } count
*/
function updateSuggestionsCount(count)
{
  // if there's a '--max-suggestions-count' property, then use it to limit the outcome of '--suggestions-count'
  const max = getComputedStyle(suggestionsElement).getPropertyValue('--max-suggestions-count');

  if (max)
    count = Math.min(max, count);

  suggestionsElement.style.setProperty('--suggestions-count', count);
}

export function registerPhrase(phrase)
{
  // if phrase has any unnecessary whitespace or ant newlines, throw an error
  if (phrase !== standard(phrase))
    throw new Error('the phrase must not have any unnecessary whitespace and also must not have any newlines');

  // if phrase has more than one word, throw an error
  if (phrase.split(/\s/).length > 1)
    throw new Error('The phrase can only have one word, additional words can be set as arguments');

  const phraseKey = phrase.toLowerCase();

  // if already registered, throw an error
  if (registeredPhrases[phraseKey] !== undefined)
    throw new Error('phrase is already registered');

  const card = createCard();

  // we want to have control over when cards are shown
  // and removed from the dom, by setting a read-only property
  // that is checked by all append and remove apis, we can accomplish that
  Object.defineProperty(card, 'isPhrased',
    {
      value: phrase,
      writable: false
    });
  
  // register the phrase
  registeredPhrases[phraseKey] = { card: card };

  return card;
}

export function unregisterPhrase(card)
{
  // if the card isn't paired with a phrase, throw an error
  if (!card.isPhrased)
    throw new Error('the card isn\'t paired with any phrase');

  const phraseKey = card.isPhrased.toLowerCase();
  
  // if the phrase that's in the card is really registered, if not throw an error
  if (!registeredPhrases[phraseKey])
    throw new Error('the card\'s phrase is not registered');

  // if phrase.card does equal the given card, if not throw an error
  if (registeredPhrases[phraseKey].card !== card)
    throw new Error('the phrase is not paired back with your card');

  // delete the phrase from the registered phrases array
  delete registeredPhrases[phraseKey];

  // clone card with a removed isPhrased property
  const clone = Object.assign(createCard(), card, { isPhrased: undefined });

  return clone;
}

export function isRegisteredPhrase(phrase)
{
  const phraseKey = phrase.toLowerCase();

  return (registeredPhrases[phraseKey] !== undefined);
}

/** set the text in the search bar (if the search bar is empty)
* @param { string } text
*/
export function setPlaceholder(text)
{
  inputElement.placeholder = text;
}