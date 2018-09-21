import { on } from './loader.js';

import Card, { createCard } from './card.js';

/** @typedef { { phrase: string | RegExp, card: Card, phraseArguments: string[] } } PhraseObj
*/

/** @type { HTMLInputElement }
*/
let inputElement;

/** @type { HTMLDivElement }
*/
let suggestionsElement;

const lastInput = '';

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

/** @type { Object<string, PhraseObj> }
*/
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

export function search(input)
{
  const inputRegex = getInputRegex(input);

  for (const phrase in registeredPhrases)
  {
    const phraseObj = registeredPhrases[phrase];

    compare(inputRegex, phraseObj.phrase);
  }
}

/** compares two strings and returns percentage, written and remaining characters
* @param { RegExp } inputRegex
* @param { string } input
* @param { string } phrase
* @param { string } argument
*/
function compare(inputRegex, phrase, argument)
{
  // this function is based on the current search regex
  // it needs to be updated every time the regex changes

  if (argument)
    argument = phrase + ' ' + argument;
  else
    argument = phrase;
  
  const searchableWords = argument.split(' ');
  const match = inputRegex.exec(argument);

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
  inputRegex.lastIndex = 0;

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

/** register a phrase, then returns a card controlled only by the search system
* @param { string } phrase
* @returns { Promise<{ card: Card, phraseArguments: string[] }> }
*/
export function registerPhrase(phrase)
{
  return new Promise((resolve, reject) =>
  {
    isRegisteredPhrase(phrase)
      .then((value) =>
      {
        // if already registered, throw an error
        if (value)
        {
          reject('phrase is already registered');
        }
        else
        {
          const card = createCard();

          // we want to have control over when cards are shown
          // and removed from the dom, by setting a read-only property
          // that is checked by all append and remove apis, we can accomplish that
          Object.defineProperty(card, 'isPhrased',
            {
              value: phrase,
              writable: false
            });
      
          const phraseKey = card.isPhrased.toLowerCase();

          /** @type { PhraseObj }
          */
          const phraseObj =
          {
            phrase: phrase,
            card: card,
            phraseArguments: []
          };

          // register the phrase
          registeredPhrases[phraseKey] = phraseObj;
    
          resolve({
            card: card,
            phraseArguments: phraseObj.phraseArguments
          });
        }
      })
      .catch((err) => reject(err));
  });
}

/** unregister a card, then returns a clone of the card that can be controlled by you
* @param { Card } card
* @returns { Promise<Card> }
*/
export function unregisterPhrase(card)
{
  return new Promise((resolve, reject) =>
  {
    // if the card isn't paired with a phrase, throw an error
    if (!card.isPhrased)
    {
      reject('the card isn\'t paired with any phrase');

      return;
    }

    const phrase = card.isPhrased;

    isRegisteredPhrase(phrase)
      .then((value) =>
      {
        // if the phrase that's in the card is really registered, if not throw an error
        if (!value)
        {
          reject('the card\'s phrase is not registered');
        }
        else
        {
          const phraseKey = card.isPhrased.toLowerCase();

          // if phrase.card does equal the given card, if not throw an error
          if (registeredPhrases[phraseKey].card !== card)
          {
            reject('the phrase is not paired back with your card');

            return;
          }

          // delete the phrase from the registered phrases array
          delete registeredPhrases[phraseKey];

          // clone card with a removed isPhrased property
          const clone = Object.assign(createCard(), card, { isPhrased: undefined });

          resolve(clone);
        }
      })
      .catch((err) => reject(err));
  });
}

/** returns true if the same phrase is registered already, false if it's not,
* @param { string } phrase
* @returns { Promise<boolean> }
*/
export function isRegisteredPhrase(phrase)
{
  return new Promise((resolve, reject) =>
  {
    // if the phrase is not actually a string type, throw an error
    if (typeof phrase !== 'string')
    {
      reject('the phrase type is not a string, it should be');
        
      return;
    }

    // if phrase has any unnecessary whitespace or ant newlines, throw an error
    if (phrase !== standard(phrase))
    {
      reject('the phrase must not have any unnecessary whitespace and also must not have any newlines');
    
      return;
    }

    const phraseKey = phrase.toLowerCase();

    resolve(registeredPhrases[phraseKey] !== undefined);
  });
}

/** set the text in the search bar (if the search bar is empty)
* @param { string } text
*/
export function setPlaceholder(text)
{
  inputElement.placeholder = text;
}