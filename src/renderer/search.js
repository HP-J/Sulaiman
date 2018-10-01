import { remote } from 'electron';

import { join } from 'path';
import { isArray } from 'util';

import { on } from './loader.js';
import { makeItCollapsible, toggleCollapse } from './renderer.js';
import { createCard, internalCreateCard } from './card.js';

const { isDebug } = remote.require(join(__dirname, '../main/window.js'));

/** @typedef { import('./card.js').default } Card
*/

/** @typedef { { phrase: string | RegExp, card: Card, phraseArguments: string[], activate: (phrase: { card: Card, phraseArguments: string[] }, matchedPhrase: string, matchedArgument: string, extra: string) => boolean, enter: () => boolean, active: boolean } } PhraseObj
*/

/** @typedef { { element: HTMLDivElement, wordCount: number, percentage: number, match: () => boolean, matchedPhrase: string, extra: string } } CompareObject
*/

/** @type { HTMLInputElement }
*/
let inputElement;

/** @type { HTMLDivElement }
*/
let suggestionsElement;

/** @type { Object<string, PhraseObj> }
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

export function registerPhrasesPhrase()
{
  return new Promise((resolve) =>
  {
    const phrasesPhrase = internalRegisterPhrase('Phrases', undefined, (phrase) =>
    {
      const card = phrase.card;

      card.reset();

      card.auto({ title: 'Available Phrases' });

      makeItCollapsible(card);

      for (const phrase in registeredPhrases)
      {
        const phraseObj = registeredPhrases[phrase];

        card.appendText(phraseObj.phrase, { style: 'Bold', select: 'Selectable', size: 'Small' });

        for (let i = 0; i < phraseObj.phraseArguments.length; i++)
        {
          card.appendText(phraseObj.phraseArguments[i], { type: 'Description', select: 'Selectable', size: 'Small' });
        }

        card.appendLineBreak();
      }

      toggleCollapse(card, undefined, true);
    });

    Promise.all([ phrasesPhrase ]).then(resolve);
  });
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
  requestAnimationFrame(() => window.scroll({ top: 0, left: 0, behavior: 'smooth' }));

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
      isClear = phraseObj.enter();

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
        activatePhrase(phraseObj, matchedCompare.matchedPhrase, matchedArgument, matchedCompare.extra);
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

/** @param { PhraseObj } phraseObj
 * @param { string } matchedPhrase
 * @param { string } matchedArgument
 * @param { string } extra
*/
function activatePhrase(phraseObj, matchedPhrase,  matchedArgument, extra)
{
  if
  (
    !phraseObj.activate ||
    !phraseObj.activate({
      card: phraseObj.card,
      phraseArguments: phraseObj.phraseArgument
    }, matchedPhrase, matchedArgument, extra))
  {
    return;
  }

  if (!document.body.contains(phraseObj.card.domElement))
    document.body.insertBefore(phraseObj.card.domElement, document.body.children[3]);

  phraseObj.active = true;
}

/** @param { PhraseObj } phraseObj
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
function compare(input, phrase, argument)
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

  // split argument to words
  const argumentSplit = (argument) ? standard(argument).split(' ') : [];

  /** the regex that wil be tested on input
  * @type { RegExp }
  */
  const regex = (isString) ? getStringRegex(phrase) : phrase;

  const match = input.match(regex);

  if (match === null)
    return undefined;

  // split the input to words
  const inputSplit = input.split(' ');

  // remove all words that matched the phrase from input array,
  // so the argument won't compare to any of them
  inputSplit.splice(0, match[0].split(' ').length);

  const phraseTextWritten = match[0];

  const wordCount = (1 + argumentSplit.length);

  /** @type { string }
  */
  const phraseText = ((isString) ? phrase : match[0]);

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
  for (let i = 0; i < argumentSplit.length; i++)
  {
    const argument = argumentSplit[i];
    const input = inputSplit[0];

    let match;

    if (input)
      match = getStringRegex(argument).exec(input);
    
    argumentLettersCount =+ argument.length;

    if (match && match[0])
    {
      inputSplit.splice(0, 1);

      const written = match[0];

      appendWrittenAndTextElement(written, argument, true);
      
      argumentLettersWrittenCount = written.length;
    }
    else
    {
      appendWrittenAndTextElement('', argument, true);
    }
  }

  return {
    element: element,
    wordCount: wordCount,
    percentage: ((phraseLettersWrittenCount + argumentLettersWrittenCount) / (phraseLettersCount + argumentLettersCount)),
    match: function()
    {
      return this.percentage === 1;
    },
    matchedPhrase: phraseTextWritten,
    extra: (inputSplit.length > 0) ? inputSplit.join(' ').trim() : ''
  };
}

/** @param { string } phrase
*/
function getStringRegex(phrase)
{
  const string = escapeRegExp(phrase);
  const split = string.split('');
  let regexString = '';

  for (let i = split.length - 1; i >= 0; i--)
  {
    const partial = string.slice(0, i + 1);

    if (partial !== string)
      regexString = regexString + '|' + partial;
    else
      regexString = partial;
  }

  return new RegExp('^(?:' + regexString + ')', 'i');
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

/** @param { string | RegExp } phrase
* @param { string[] } [args]
* @param { (phrase: PhraseObj, argument: string, extra: string) => void } [activate]
* @param { () => boolean } [enter]
* @returns { Promise<{ card: Card, phraseArguments: string[] }> }
*/
export function internalRegisterPhrase(phrase, args, activate, enter)
{
  return registerPhrase(internalCreateCard(), phrase, args, activate, enter);
}

/** @param { Card } card
* @param { string | RegExp } phrase
* @param { string[] } [args]
* @param { (phrase: PhraseObj, argument: string, extra: string) => void } [activate]
* @param { () => boolean } [enter]
* @returns { Promise<{ card: Card, phraseArguments: string[] }> }
*/
export function registerPhrase(card, phrase, args, activate, enter)
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
            phraseArguments: [],
            activate: activate,
            enter: enter,
            active: false
          };

          if (args && isArray(args))
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