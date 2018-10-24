import { remote } from 'electron';

import { join } from 'path';
import { isArray } from 'util';

import { on } from './loader.js';
import { makeItCollapsible } from './renderer.js';
import { createCard, internalCreateCard } from './card.js';

const { isDebug } = remote.require(join(__dirname, '../main/window.js'));

/** @typedef { import('./card.js').default } Card
*/

/** @typedef { Object } PhraseEvents
* @property { (matchedPhrase: string) => string[] } [search]
* emits every time a search occurs with a phrase match, should return a string array of arguments that replaces default arguments,
* if you have a fixed set of arguments that won't need to be updated every search please use defaultArgs array instead

* @property { (argument: string) => string[] } [suggest]
* emits every time an argument is fully matched,
* should return string array of argument suggestions, argument suggestions are visible as suggestion items but are not real arguments,
* the user can auto-complete them as usual, however, they will not be activated directly, instead the argument they are pre-fixed to
* is the the one that gets activated, the suggestion will only be accessible from the `extra` parameter,
* any suggestion will be pre-fixed with the argument automatically, if it's not already

* @property { (card: Card, suggestion: HTMLElement, matchedPhrase: string, matchedArgument: string, extra: string) => boolean } [activate]
* emits when the phrase (and an argument) is fully matched,
* should return a boolean that equals true to show the phrase's card or equals false to not show it, default is true

* @property { (suggestion: HTMLElement, matchedPhrase: string, argument: string, extra: string) => { searchBarInput: "auto-complete-suggestion" | "clear-search-bar", blurSearchBar: boolean, selectInput: boolean } } [enter]
* emits when the user presses the `Enter` key while a suggestion is selected,
* you can change some of the options that occur to the search bar,
* default options are just blurring the search bar, other options include selecting the search bar text or
* clearing the search bar input
*/

/** @typedef { { phrase: string | RegExp, card: Card, defaultArgs: string[], emit: PhraseEvents } } PhraseObject
*/

/** @typedef { { element: HTMLElement, wordCount: number, writtenWordCount: number, percentage: number, match: () => boolean, visible: () => boolean, matchedPhrase: string, matchedArgument: string, extra: string } } CompareObject
*/

/** @type { HTMLInputElement }
*/
let inputElement;

/** @type { HTMLDivElement }
*/
let suggestionsElement;

/** @type { Object<string, PhraseObject> }
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

  inputElement.oninput = oninput;
  inputElement.onkeydown = onkeydown;

  inputElement.onfocus = () =>
  {
    toggleSuggestionElement();
    
    oninput();
  };
  
  inputElement.onblur = toggleSuggestionElement;

  on.focus(focus);
  on.blur(blur);
  on.ready(oninput);
}

export function registerPhrasesPhrase()
{
  return new Promise((resolve) =>
  {
    const phrasesPhrase = internalRegisterPhrase('Phrases', undefined, {
      activate: (card) =>
      {
        card.reset();

        card.auto({ title: 'Available Phrases' });

        makeItCollapsible(card);

        for (const phrase in registeredPhrases)
        {
          const phraseObj = registeredPhrases[phrase];

          card.appendText(phraseObj.phrase, { style: 'Bold', select: 'Selectable', size: 'Small' });

          for (let i = 0; i < phraseObj.defaultArgs.length; i++)
          {
            card.appendText(phraseObj.defaultArgs[i], { type: 'Description', select: 'Selectable', size: 'Small' });
          }

          card.appendLineBreak();
        }
      }
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

/** gets called every time sulaiman loses focus
*/
function blur()
{
  // clear the search bar on sulaiman blur
  if (!isDebug())
    setInput('');
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

  // remove old suggestion elements
  while (suggestionsElement.firstChild)
  {
    suggestionsElement.removeChild(suggestionsElement.firstChild);
  }

  if (!input)
  {
    // deactivate any active phrases
    search();
  }
  else
  {
    // show new suggestion, and activate phrases
    search(input).then(() =>
    {
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
    event.preventDefault();

    selectItem(-1);
  }
  else if (event.code === 'ArrowDown')
  {
    event.preventDefault();

    selectItem(1);
  }
  else if (event.code === 'ArrowRight')
  {
    if (
      (inputElement.selectionEnd + 1 > inputElement.value.length) &&
      (suggestionsElement.children.length > selectIndex)
    )
      setInput(suggestionsElement.children[selectIndex].value || suggestionsElement.children[selectIndex].innerText);
  }
  else if (event.code === 'Enter')
  {
    if (suggestionsElement.children.length > selectIndex)
    {
      /** @type { { searchBarInput: "auto-complete-suggestion" | "clear-search-bar", blurSearchBar: boolean, selectInput: boolean } }
      */
      let options;

      const phrase = suggestionsElement.children[selectIndex].phrase;

      const isString = (typeof phrase === 'string');
  
      const phraseKey = (isString) ? phrase.toLowerCase() : phrase;
      const phraseObj = registeredPhrases[phraseKey];

      if (phraseObj.emit.enter)
        options = phraseObj.emit.enter(
          suggestionsElement.children[selectIndex],
          suggestionsElement.children[selectIndex].phrase,
          suggestionsElement.children[selectIndex].argument,
          suggestionsElement.children[selectIndex].extra,
        );

      if (!options || typeof options !== 'object')
        options = { searchBarInput: 'auto-complete-suggestion', blurSearchBar: true };

      if (options.searchBarInput === 'auto-complete-suggestion')
        setInput(suggestionsElement.children[selectIndex].value || suggestionsElement.children[selectIndex].innerText);
      else if (options.searchBarInput === 'clear-search-bar')
        setInput('');

      if (options.blurSearchBar)
        inputElement.blur();

      if (options.selectSearchBarText)
        inputElement.select();
    }
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

  if (nextElement && !nextElement.classList.contains('suggestionsItemSelected'))
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

/** @param { PhraseObject } phraseObj
* @param { HTMLElement } suggestionElement
* @param { string } matchedPhrase
* @param { string } matchedArgument
* @param { string } extra
*/
function activatePhrase(phraseObj, suggestionElement, matchedPhrase,  matchedArgument, extra)
{
  // cache element text as the auto-complete value before giving away the suggestion element, however it's still
  // possible to modify it, using the suggestionElement.value
  suggestionElement.value = suggestionElement.innerText;

  // activePhrases.push(phraseObj);

  if
  (
    phraseObj.emit.activate &&
    phraseObj.emit.activate(phraseObj.card, suggestionElement, matchedPhrase, matchedArgument, extra) !== false
  )
  {
    if (!document.body.contains(phraseObj.card.domElement))
      document.body.insertBefore(phraseObj.card.domElement, document.body.children[3]);

    phraseObj.active = true;
  }
}

/** @param { PhraseObject } phraseObj
*/
function deactivatePhrase(phraseObj)
{
  // activePhrases.splice(activePhrases.indexOf(phraseObj), 1);

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

      if (input)
      {
        const args = [];

        let overriddenArgs;

        const phraseCompareObject = compare(input, phraseObj.phrase);

        if (phraseObj.emit.search && phraseCompareObject.percentage > 0)
          overriddenArgs = phraseObj.emit.search(phraseCompareObject.matchedPhrase, phraseCompareObject.phrase);

        if (overriddenArgs && isArray(overriddenArgs))
          args.push(...overriddenArgs);
        else
          args.push(...phraseObj.defaultArgs);

        // if the phrase has no arguments
        if (args.length <= 0)
        {
          // if there is not match what-so-ever, skip it
          if (phraseCompareObject.visible())
          {
            if (phraseCompareObject.match())
              matchedCompare = phraseCompareObject;

            suggestions.push(phraseCompareObject);
          }
        }
        else
        {
          // else the phrase must have one or more arguments
          // loop through the phrase's arguments, comparing them
          for (let i = 0; i < args.length; i++)
          {
            const compareObject = compare(input, phraseObj.phrase, args[i]);

            if (!compareObject)
              continue;

            // if there is not match what-so-ever, skip it
            if (compareObject.visible())
            {
              if (compareObject.match())
                matchedCompare = compareObject;

              suggestions.push(compareObject);
            }
          }
        }
      }

      if (matchedCompare)
      {
        // argument suggestions
        if (phraseObj.emit.suggest)
        {
          let additionalArgs = phraseObj.emit.suggest(matchedCompare.matchedArgument);

          if (additionalArgs && isArray(additionalArgs))
          {
            additionalArgs = additionalArgs.map(a =>
              a.startsWith(matchedCompare.matchedArgument + ' ') ? a : matchedCompare.matchedArgument + ' ' + a
            );

            for (let i = 0; i < additionalArgs.length; i++)
            {
              const compareObject = compare(input, phraseObj.phrase, additionalArgs[i]);

              if (compareObject && compareObject.visible())
              {
                // fix the argument portion, add the extra property, since additional args are not real arguments
                compareObject.element.argument = matchedCompare.matchedArgument;
                compareObject.element.extra = additionalArgs[i].substring(matchedCompare.matchedArgument.length + 1);

                suggestions.push(compareObject);
              }
            }
          }
        }

        // activate it
        activatePhrase(phraseObj, matchedCompare.element, matchedCompare.matchedPhrase, matchedCompare.matchedArgument, matchedCompare.extra);
      }
      else if (phraseObj.active)
        // if not and the phrase is still active from previous compare
        // deactivate it
        deactivatePhrase(phraseObj);
    }

    // sort all compare objects based on their percentage
    sort(suggestions, (a, b) =>
    {
      if (a.writtenWordCount > b.writtenWordCount)
        return -1;
      else if (a.writtenWordCount < b.writtenWordCount)
        return 1;

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

/** @param { string } written
* @param { string } text
*/
function getExact(written, text)
{
  return text.substring(0, written.length);
}

/** @param { HTMLElement } element
* @param { string } written
* @param { string } text
*/
function appendWrittenAndTextElement(element, written, text)
{
  if (element.innerText)
    element.appendChild(document.createElement('div')).innerText = ' ';

  if (written)
    element.appendChild(document.createElement('mark')).innerText = written;
  
  element.appendChild(document.createElement('div')).innerText = text.slice(written.length);
}

/** @param { string } input
* @param { RegExp } phraseRegex
* @param { string | RegExp } phrase
* @param { string } argument
* @returns { CompareObject }
*/
function compare(input, phrase, argument)
{
  // phrase type
  const isString = (typeof phrase === 'string');

  /** the regex that wil be tested on input
  * @type { RegExp }
  */
  const regex = (isString) ? getStringRegex(phrase) : phrase;

  const match = input.match(regex) || [ '' ];

  // split the input to words
  const inputSplit = input.split(' ');

  // split argument to words
  const argumentSplit = (argument) ? standard(argument).split(' ') : [];

  /** @type { string }
  */
  const phraseText = ((isString) ? phrase : match[0]);
  const phraseTextWritten = getExact(match[0], phraseText);

  const phraseLettersCount = phraseText.length;
  const phraseLettersWrittenCount = phraseTextWritten.length;

  let argumentTextWritten = '';

  let argumentLettersCount = 0;
  let argumentLettersWrittenCount = 0;

  const wordCount = phraseText.split(' ').length + argumentSplit.length;
  let writtenWordCount = 0;

  // if the phrase word itself matches
  if (match[0])
  {
    // remove all words that matched the phrase from input array,
    // so the argument won't compare to any of them
    inputSplit.splice(0, match[0].split(' ').length);
  
    writtenWordCount = writtenWordCount + 1;
  }

  // create an element for the suggestion item
  const element = document.createElement('div');

  // set the element as suggestions item
  element.setAttribute('class', 'suggestionsItem');

  // append a text and text written elements for the phrase, on the suggestions item
  appendWrittenAndTextElement(element, phraseTextWritten, phraseText);

  // process arguments (any thing after the first word)
  for (let i = 0; i < argumentSplit.length; i++)
  {
    const argument = argumentSplit[i];
    const input = inputSplit[0];

    let match;

    if (input)
      match = getStringRegex(argument).exec(input);

    argumentLettersCount = argumentLettersCount + argument.length;

    if (match && match[0])
    {
      inputSplit.splice(0, 1);

      const written = getExact(match[0], argument);

      if (i > 0)
        argumentTextWritten = argumentTextWritten + ' ' + written;
      else
        argumentTextWritten = written;

      appendWrittenAndTextElement(element, written, argument);

      writtenWordCount = writtenWordCount + 1;

      argumentLettersWrittenCount = argumentLettersWrittenCount + written.length;
    }
    else
    {
      appendWrittenAndTextElement(element, '', argument);
    }
  }

  const extra = (inputSplit.length > 0) ? inputSplit.join(' ').trim() : undefined;

  // pair the element to it's phrase and argument
  element.phrase = phrase;
  element.phraseText = phraseText;
  element.argument = argument;

  return {
    element: element,
    wordCount: wordCount,
    writtenWordCount: writtenWordCount,
    percentage: ((phraseLettersWrittenCount + argumentLettersWrittenCount) / (phraseLettersCount + argumentLettersCount)),
    match: function()
    {
      return (this.percentage === 1);
    },
    visible: function()
    {
      if (this.percentage > 0)
        return true;

      return false;
    },
    matchedPhrase: phraseTextWritten,
    matchedArgument: argumentTextWritten,
    extra: extra
  };
}

/** @param { string } phrase
*/
function getStringRegex(phrase)
{
  let regexString = '';

  const split = phrase.split('');
  const length = split.length - 1;

  for (let i = length; i >= 0; i--)
  {
    const partial = escapeRegExp(phrase.slice(0, i + 1));

    if (i === length)
      regexString = partial;
    else
      regexString = regexString + '|' + partial;
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

/** @param { string | RegExp } phrase
* @param { string[] } [defaultArgs]
* @param { PhraseEvents } [on]
* @returns { Promise<Card> }
*/
export function internalRegisterPhrase(phrase, defaultArgs, on)
{
  return registerPhrase(internalCreateCard(), phrase, defaultArgs, on);
}

/** @param { Card } card
* @param { string | RegExp } phrase
* @param { string[] } [defaultArgs]
* @param { PhraseEvents } [on]
* @returns { Promise<{}> }
*/
export function registerPhrase(card, phrase, defaultArgs, on)
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

          /** @type { PhraseObject }
          */
          const phraseObj =
          {
            phrase: phrase,
            card: card,
            defaultArgs: [],
            emit: on,
            active: false
          };

          if (!on)
            phraseObj.emit = {};

          if (defaultArgs && isArray(defaultArgs))
            phraseObj.defaultArgs.push(...defaultArgs);

          // register the phrase
          registeredPhrases[phraseKey] = phraseObj;

          resolve(card);
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