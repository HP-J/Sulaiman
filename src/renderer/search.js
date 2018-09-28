import { remote } from 'electron';

import { join } from 'path';

import { on } from './loader.js';
import { createCard } from './card.js';

const { isDebug } = remote.require(join(__dirname, '../main/window.js'));

/** @typedef { import('./card.js').default } Card
*/

/** @typedef { { phrase: string | RegExp, card: Card, phraseArguments: string[], activate: (argument: string, extra: string) => boolean, enter: () => boolean, active: boolean } } InternalPhraseObj
*/

/** @typedef { { card: Card, phraseArguments: string[] } } PhraseObj
*/

/** @typedef { { element: HTMLDivElement, wordCount: number, percentage: number, match: () => boolean, extra: string } } CompareObject
*/

/** @type { HTMLInputElement }
*/
let inputElement;

/** @type { HTMLDivElement }
*/
let suggestionsElement;

/** @type { Object<string, InternalPhraseObj> }
*/
const registeredPhrases = {};

let lastInput = '';

let selectIndex = 0;

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
  setInput('');
}

/** gets called every time sulaiman loses focus
*/
function blur()
{
  // clear the search bar on sulaiman blur
  if (!isDebug())
    clear();
}

/** gets called when the user changes the input value
*/
function oninput()
{
  const input = standard(inputElement.value);

  if (input === lastInput)
    return;

  lastInput = input;

  // on input scroll to top of the window
  window.scroll({ top: 0, left: 0, behavior: 'smooth' });

  if (!input)
  {
    updateSuggestionsCount(0);

    // deactivate phrases
    search();
  }
  else
  {
    // remove old suggestion elements
    while (suggestionsElement.firstChild)
    {
      suggestionsElement.removeChild(suggestionsElement.firstChild);
    }

    // show new suggestion, and activate phrases
    search(input).then(() =>
    {
      // update the suggestions count on the css variable
      updateSuggestionsCount(suggestionsElement.children.length);

      // update the select index to the first suggestion and select it
      selectItem(-selectIndex);
    });
  }
}

/** @param { KeyboardEvent } event
*/
function onkeydown(event)
{
  if (event.code === 'ArrowUp')
  {
    selectItem(-1);
  }
  else if (event.code === 'ArrowDown')
  {
    selectItem(1);
  }
  else if (event.code === 'ArrowRight')
  {
    if (suggestionsElement.children.length > selectIndex)
      setInput(suggestionsElement.children[selectIndex].innerText);
  }
  else if (event.code === 'Enter')
  {
    inputElement.blur();

    const phrase = suggestionsElement.children[selectIndex].phrase;

    const isString = (typeof phrase === 'string');

    const phraseKey = (isString) ? phrase.toLowerCase() : phrase;
    const phraseObj = registeredPhrases[phraseKey];

    let isClear;

    if (phraseObj.enter)
      isClear = phraseObj.enter({ card: phraseObj.card, phraseArguments: phraseObj.phraseArguments });

    if (isClear)
      clear();
  }
}

/** @param { number } indexDiff
*/
function selectItem(indexDiff)
{
  if (suggestionsElement.children.length <= 0)
    return;

  const nextIndex = Math.min(Math.max(selectIndex + indexDiff, 0), suggestionsElement.children.length - 1);

  const nextElement = suggestionsElement.children[nextIndex];
  const currentElement = suggestionsElement.children[selectIndex];
  
  if (currentElement && nextElement !== currentElement && currentElement.classList.contains('suggestionsItemSelected'))
  {
    currentElement.classList.remove('suggestionsItemSelected');

    requestAnimationFrame(() =>
    {
      currentElement.scrollIntoView({
        behavior: 'instant',
        inline: 'nearest',
        block: 'nearest'
      });
    });
  }

  if (!nextElement.classList.contains('suggestionsItemSelected'))
  {
    nextElement.classList.add('suggestionsItemSelected');

    requestAnimationFrame(() =>
    {
      nextElement.scrollIntoView({
        behavior: 'smooth',
        inline: 'nearest',
        block: 'nearest'
      });
    });
  }

  selectIndex = nextIndex;
}

/** @param { string } input
*/
function search(input)
{
  return new Promise((resolve) =>
  {
    /** @type { CompareObject[] }
    */
    const suggestions = [];
    
    // search all phrases are their arguments
    for (const phrase in registeredPhrases)
    {
      const phraseObj = registeredPhrases[phrase];

      /** @type { CompareObject }
      */
      let matchedCompare = undefined;
      let matchedArgument = '';
      
      if (input)
      {
        // if the phrase has no arguments
        if (!phraseObj.phraseArguments || phraseObj.phraseArguments.length <= 0)
        {
          const compareObject = compare(input, phraseObj.phrase);
  
          // if there is not match what-so-ever, continue the main phrases loop
          if (!compareObject)
            continue;
  
          if (compareObject.match())
          {
            matchedCompare = compareObject;
          }
  
          suggestions.push(compareObject);
        }
        else
        {
          // else the phrase must have one or more arguments
          // loop through the phrase's arguments, comparing them
          for (let i = 0; i < phraseObj.phraseArguments.length; i++)
          {
            const compareObject = compare(input, phraseObj.phrase, phraseObj.phraseArguments[i]);
  
            // if there is not match what-so-ever, continue the phrase arguments loop
            if (!compareObject)
              continue;
  
            if (compareObject.match())
            {
              matchedCompare = compareObject;
              matchedArgument = phraseObj.phraseArguments[i];
            }

            suggestions.push(compareObject);
          }
        }
      }

      // this is to make sure that activatePhrase doesn't somehow get called twice on same compare
      // and to stop next-cycle deactivation inside of the arguments loop
      // if there is a match in the phrase
      if (matchedCompare)
        // activate it
        activatePhrase(phraseObj, matchedCompare.extra, matchedArgument);
      else if (phraseObj.active)
        // if not and the phrase is still active from previous compare
        // deactivate it
        deactivatePhrase(phraseObj);
    }
      
    // sort all compare objects based on their percentage
    sort(suggestions, (a, b) =>
    {
      if (a.percentage > b.percentage)
        return -1;
      else if (a.percentage < b.percentage)
        return 1;

      if (a.wordCount > b.wordCount)
        return 1;
      if (a.wordCount < b.wordCount)
        return -1;
      else
        return 0;
    });

    // add new suggestion items
    for (let i = 0; i < suggestions.length; i++)
    {
      suggestionsElement.appendChild(suggestions[i].element);
    }

    resolve();
  });
}

/** @param { InternalPhraseObj } phraseObj
* @param { string } extra
* @param { string } argument
*/
function activatePhrase(phraseObj, extra, argument)
{
  let activate;

  if (phraseObj.activate)
    activate = phraseObj.activate({ card: phraseObj.card, phraseArguments: phraseObj.phraseArguments }, argument, extra);

  if (activate === undefined || activate)
  {
    if (!document.body.contains(phraseObj.card.domElement))
      document.body.appendChild(phraseObj.card.domElement);
    
    phraseObj.active = true;
  }
}

/** @param { InternalPhraseObj } phraseObj
*/
function deactivatePhrase(phraseObj)
{
  if (document.body.contains(phraseObj.card.domElement))
    document.body.removeChild(phraseObj.card.domElement);

  phraseObj.active = false;
}

/** @param { T[] } array
* @template T
* @param { (a: T, b: T) => number } compare
*/
function sort(array, compare)
{
  array.sort(compare);
}

/** @param { string } input
* @param { RegExp } phraseRegex
* @param { string | RegExp } phrase
* @param { string } argument
* @returns { CompareObject }
*/
export function compare(input, phrase, argument)
{
  /** @param { string } written
  * @param { string } text
  * @param { boolean } isArgument
  */
  function appendWrittenAndTextElement(written, text, isArgument)
  {
    const containerElement = document.createElement('div');
    
    for (let textIndex = 0, writtenIndex = 0; textIndex < text.length; textIndex++)
    {
      const textChar = text.charAt(textIndex);
      const writtenChar = written.charAt(writtenIndex);

      if (textChar.toLowerCase() === writtenChar.toLowerCase())
      {
        writtenIndex += 1;

        containerElement.appendChild(document.createElement('mark')).innerText = textChar;
      }
      else
      {
        containerElement.appendChild(document.createTextNode(textChar));
      }
    }

    if (isArgument)
      element.appendChild(document.createElement('div')).innerText = ' ';

    element.appendChild(containerElement);
  }

  // phrase type
  const isString = (typeof phrase === 'string');

  /** split the input to words
  * @type { string[] }
  */
  const inputSplit = input.split(' ');

  // the first word in input, used for the phrase's regex search
  const inputFirstWord = inputSplit[0];

  // split argument to words
  const argumentSplit = (argument) ? standard(argument).split(' ') : [];

  /** the regex that wil be tested on input
  * @type { RegExp }
  */
  const regex = (isString) ? getStringRegex(phrase) : phrase;

  const wordCount = (1 + argumentSplit.length);

  // if input word count is higher then searchable word count
  if (inputSplit.length > wordCount)
    return undefined;

  const match = regex.exec(inputFirstWord);

  // if first input word match the phrase it self
  // make sure not to compare it to the phrase arguments
  if (match && match[0])
    inputSplit.splice(0, 1);

  const phraseTextWritten = (match) ? match[0] : '';

  /** @type { string }
  */
  const phraseText = ((isString) ? phrase : inputFirstWord);

  const phraseLettersWrittenCount = phraseTextWritten.length;
  const phraseLettersCount = phraseText.length;

  let argumentLettersWrittenCount = 0;
  let argumentLettersCount = 0;

  // create an element for the suggestion item
  const element = document.createElement('div');

  // set the element as suggestions item
  element.setAttribute('class', 'suggestionsItem');

  // pair the element to it's phrase
  element.phrase = phrase;

  // append a text and text written elements for the phrase, on the suggestions item
  appendWrittenAndTextElement(phraseTextWritten, phraseText);

  // process arguments (any thing after the first word)
  for (let i = 0, x = 0; i < argumentSplit.length; i++)
  {
    const argument = argumentSplit[i];
    const input = inputSplit[x];

    let match;

    if (input)
      match = getStringRegex(argument).exec(input);
    
    argumentLettersCount =+ argument.length;

    if (match && match[0])
    {
      const written = match[0];

      appendWrittenAndTextElement(written, argument, true);
      
      argumentLettersWrittenCount = written.length;

      x += 1;
    }
    else
    {
      appendWrittenAndTextElement('', argument, true);
    }
  }

  // if percentage is an absolute zero, don't show the item
  if (phraseLettersWrittenCount + argumentLettersWrittenCount <= 0)
    return undefined;

  return {
    element: element,
    wordCount: wordCount,
    percentage: ((phraseLettersWrittenCount + argumentLettersWrittenCount) / (phraseLettersCount + argumentLettersCount)),
    match: function()
    {
      return this.percentage === 1;
    },
    extra: input.replace(phraseText + ' ' + (argument || ''), '').trim()
  };
}

/** @param { string } phrase
*/
function getStringRegex(phrase)
{
  return new RegExp('(' + escapeRegExp(phrase).split('').join('?') + '?)', 'i');
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
* @param { string | RegExp } phrase
* @param { string[] } [args] an array of possible arguments like: the 'Tray' in 'Options Tray'
* @param { (phrase: PhraseObj, argument: string, extra: string) => boolean } [activate] emits when the phrase and/or an argument is matched,
* should return a boolean that equals true to show the phrase's card or equals false to not show it, default is true
* @param { (phrase: PhraseObj) => boolean } [enter] emits when the user presses the `Enter` key while the search bar is on focus
* and the phrase and/or an argument is matched, should return a boolean that equals true to clear the search bar after
* which will deactivate the phrase, or equals false to leave the phrase active, default is false
* @returns { Promise<PhraseObj> }
*/
export function registerPhrase(phrase, args, activate, enter)
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

          /** @type { InternalPhraseObj }
          */
          const phraseObj =
          {
            phrase: phrase,
            card: card,
            phraseArguments: [],
            activate: activate,
            enter: enter,
            active: false
          };

          if (args)
            phraseObj.phraseArguments.push(...args);

          // register the phrase
          registeredPhrases[phraseKey] = phraseObj;
    
          resolve({ card: card, phraseArguments: phraseObj.phraseArguments });
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

/** returns true if the same phrase is registered already, false if it's not
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

    // don't register an empty phrase
    if (isString && !phrase)
    {
      reject('the phrase is empty');
    
      return;
    }

    const phraseKey = (isString) ? phrase.toLowerCase() : phrase;

    resolve(registeredPhrases[phraseKey] !== undefined);
  });
}

/** set the text in the search bar
* @param { string } input
*/
export function setInput(input)
{
  inputElement.value = input;

  oninput();
}

/** set the text in the search bar (if the search bar is empty)
* @param { string } text
*/
export function setPlaceholder(text)
{
  inputElement.placeholder = text;
}