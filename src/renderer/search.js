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

function search(input)
{
  // for (const phrase in registeredPhrases)
  // {
  //   const phraseObj = registeredPhrases[phrase];

  //   compare(input, phraseObj.regex);
  // }
}

/** @param { string } input
* @param { RegExp } phraseRegex
* @param { string | RegExp } phrase
* @param { string } argument
*/
export function compare(input, phrase, argument)
{
  /** replaces the unescapable characters in a regex with escapable characters
  * @param { string } s the string you want to update
  */
  function escapeRegExp(s)
  {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** @param { string } phrase
  */
  function getStringRegex(phrase)
  {
    return new RegExp('(' + escapeRegExp(phrase).split('').join('?') + '?.*?)', 'i');
  }

  /** @param { string } remaining
  * @param { string } written
  * @param { boolean } isTextFirst
  * @param { boolean } isArgument
  */
  function appendTextAndWrittenElements(written, remaining, isTextFirst, isArgument)
  {
    const textElementRemaining = document.createElement('div');
    const textElementWritten = document.createElement('div');
  
    textElementWritten.setAttribute('class', 'suggestionsItemWrittenText');

    textElementRemaining.innerText = remaining;
    textElementWritten.innerText = written;

    if (isTextFirst)
    {
      element.appendChild(textElementRemaining);
      element.appendChild(textElementWritten);
    }
    else
    {
      element.appendChild(textElementWritten);
      element.appendChild(textElementRemaining);
    }

    if (isArgument)
    {
      const textElement = ((isTextFirst) ? textElementRemaining : textElementWritten);
      
      textElement.innerText = ' ' + textElement.innerText;
    }

    return { textElementRemaining: textElementRemaining, textElementWritten: textElementWritten };
  }

  /** @param { string } remaining
  * @param { string } written
  */
  function getComparePercentage(written, remaining)
  {
    return (written.length / (written + remaining).length) * 100;
  }

  // phrase type
  const isString = (typeof phrase === 'string');
  
  /** split the input to words
  * @type { string[] }
  */
  const inputSplit = input.split(' ');

  // the first word in input, used for the phrase's regex search
  const inputFirstWord = inputSplit[0];

  // remove the first word from the array, because the rest of the array will be used for the argument's regex search
  inputSplit.splice(0, 1);

  // split argument to words
  const argumentSplit = (argument) ? standard(argument).split(' ') : [];
  
  /** the regex that wil be tested on input
  * @type { RegExp }
  */
  const regex = (isString) ? getStringRegex(phrase) : phrase;

  // the total percentage for the comparison
  const totalPercentage = 100 + (argumentSplit.length * 100);

  // the final percentage for the comparison
  let comparePercentage = 0;

  // if only the phrase matches
  let phraseMatch = false;

  const match = regex.exec(inputFirstWord);

  // if there is no match, then return undefined
  if (!match || !match[0])
    return undefined;

  const phraseTextWritten = match[0];
  let phraseTextRemaining = '';
  
  if (
    // if not string, then always match phrase
    (!isString) ||
    // if is string, check match if equals to string
    (isString && phraseTextWritten.length === phrase.length)
  )
  {
    // callback match function with argument
    // if returned true show card, set as active

    phraseMatch = true;
    comparePercentage = 100;
  }

  if (isString)
    phraseTextRemaining = phrase.replace(phraseTextWritten, '').split(' ');
  else
    phraseTextRemaining = inputFirstWord.replace(phraseTextWritten, '').split(' ');

  const isTextFirst = (isString) ? !phrase.startsWith(phraseTextWritten) : !input.startsWith(phraseTextWritten);

  // if the phrase doesn't match, that mean that the phrase is a string type
  // and that it's not completely written, add the correct compare percentage for the first word
  if (!phraseMatch)
    comparePercentage += getComparePercentage(phraseTextWritten, phraseTextRemaining);

  // create an element for the suggestion item
  const element = document.createElement('div');
  
  // set the element as suggestions item
  element.setAttribute('class', 'suggestionsItem');

  // append a text and text written elements for the phrase, on the suggestions item
  appendTextAndWrittenElements(phraseTextWritten, phraseTextRemaining, isTextFirst);
  
  // process arguments (any thing after the first word)
  for (let i = 0, x = 0; i < argumentSplit.length; i++)
  {
    const argument = argumentSplit[i];
    const input = inputSplit[x];

    let match;

    if (input)
      match = getStringRegex(argument).exec(input);

    if (match && match[0])
    {
      const written = match[0];
      const remaining = argument.replace(written, '');
      const isTextFirst = !argument.startsWith(written);

      appendTextAndWrittenElements(written, remaining, isTextFirst, true);
      
      comparePercentage += getComparePercentage(written, remaining);

      console.log(comparePercentage + '/' + totalPercentage);

      x += 1;
    }
    else
    {
      appendTextAndWrittenElements('', argument, false, true);
    }
  }

  return { element: element, totalPercentage: totalPercentage, comparePercentage: comparePercentage, phraseMatch: phraseMatch };
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
* @param { string | RegExp } phrase
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
      
          const isString = (typeof phrase === 'string');
          const phraseKey = (isString) ? phrase.toLowerCase() : phrase;

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
          const isString = (typeof phrase === 'string');
          const phraseKey = (isString) ? phrase.toLowerCase() : phrase;

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
* @param { string | RegExp } phrase
* @returns { Promise<boolean> }
*/
export function isRegisteredPhrase(phrase)
{
  return new Promise((resolve, reject) =>
  {
    const isString = (typeof phrase === 'string');

    // if the phrase is not actually a string type, throw an error
    if (!isString && !(phrase instanceof RegExp))
    {
      reject('the phrase type is not a string or a regex, it should be one of those two');
        
      return;
    }

    // if a string phrase has any unnecessary whitespace or ant newlines, throw an error
    if (isString && phrase !== standard(phrase))
    {
      reject('the phrase must not have any unnecessary whitespace and also must not have any newlines');
    
      return;
    }

    const phraseKey = (isString) ? phrase.toLowerCase() : phrase;

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