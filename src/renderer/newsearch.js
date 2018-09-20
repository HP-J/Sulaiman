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

  compare('He Wo', 'hello world');
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
  // else scroll to top of the body `window.scroll`
  // then search phrase

  // searchPhrases(input);
}

function searchPhrases(input)
{
  // for (const phrase in registeredPhrases)
  // {
  //   compare(input, phrase);
  // }
}

/** compares two strings and returns percentage, written and remaining characters
* @param { string } input
* @param { string } searchable
*/
function compare(input, searchable)
{
  // searchable = searchable.replace(' ', '\n');
  const regex = getInputRegex('Wo');
  
  // if input and searchable aren't empty strings
  if (!input || !searchable)
    return undefined;
  
  const total = searchable.split(' ').length * 100;
  const match = regex.exec(searchable);
  
  let compareNumber = 0;
  const element = document.createElement('div');

  element.setAttribute('class', 'suggestionsItem');

  for (let i = 0; i < match.length; i++)
  {
    // const element = match[i];
    
  }

  regex.lastIndex = 0;

  return { compareNumber: compareNumber, element: element }

  // let inputIndex = 0;
  // let searchableIndex = 0;

  // for (; searchableIndex < searchableArray.length; searchableIndex++)
  // {
  //   const s = searchableArray[searchableIndex];
  //   const out = s.match(inputArray[inputIndex]);

  //   if (out)
  //   {
  //     inputIndex += 1;

  //     console.log(out);
  //   }
  //   else
  //   {
  //     console.log(searchableArray[searchableIndex]);
  //   }
  // }

  // const regex = /^(Wo)([^\n]*)/igm;
  
  // console.log(regex.exec('hello\nworld'));
  // console.log(regex.exec('hello\nworld'));

  // const regex = splitInput.join()
  
  // a regex that captures the start of a string, case-insensitive
  // in this case if the searchable starts with the input
  // const regex = searchable.match(new RegExp('^(' + escapeRegExp(input) + ')(.*)', 'i'));
    
  // if the searchable doesn't start with the input
  // if (!regex)
  //   return undefined;

  // const total = regex[0];
  // const written = regex[1];
  // const remaining = regex[2];

  // const percentage = written.length / total.length;

  // console.log('(' + percentage + ') ' + input + '/' + searchable);
  
  // return { percentage: percentage, written: written, remaining: remaining };
}

/** @param {string} input
*/
function getInputRegex(input)
{
  const uncut = '([\\s\\S]*)';

  const regexString = input.split(' ').map(
    (string, i, array) =>
    {
      // string = '(^' + escapeRegExp(string) + ')([^\\n]*)';
      string = '(' + escapeRegExp(string) + '+?)';

      if (i <= 0)
        string = uncut + string;
        
      if (i >= array.length - 1)
        string = string + uncut;

      return string;
    }
  );

  // return new RegExp(regexString.join('|'), 'igm');
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