import { on } from './loader.js';

import Card, { createCard } from './card.js';

/** @type { HTMLInputElement }
*/
let inputElement;

/** @type { HTMLDivElement }
*/
let suggestionsElement;

/**
* @type { Object.<string, { card: Card, callback: Function, element: HTMLDivElement } > }
*/
const registeredPhrases = {};

let suggestionsIndex = 0;

let lastInput = '';

/** @type { HTMLDivElement }
*/
let lastSuggestionItemSelected = undefined;

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

/** gets called every time sulaiman loses focus
*/
function blur()
{
  // empty the search bar
  if (!process.env.DEBUG)
  {
    inputElement.value = '';

    oninput();
  }
}

/** gets called when the user changes the input value
*/
function oninput()
{
  const input = standard(inputElement.value);

  if (input === lastInput)
    return;

  if (input.length <= 0)
  {
    updateSuggestionsCount(0);
  }
  else
  {
    window.scroll({
      behavior: 'smooth',
      left: 0,
      top: 0
    });

    const suggestionsData = handlePhrases(input);

    handleSuggestions(suggestionsData);
  }

  lastInput = input;
}

/** gets called on key downs while the search bar is focused
* @param { KeyboardEvent } event
*/
function onkeydown(event)
{
  if (event.key === 'ArrowUp')
    suggestionsIndex = Math.min(Math.max(suggestionsIndex - 1, 0), suggestionsElement.children.length - 1);
  else if (event.key === 'ArrowDown')
    suggestionsIndex = Math.min(Math.max(suggestionsIndex + 1, 0), suggestionsElement.children.length - 1);

  if (suggestionsElement.children.length > 0)
  {
    const element = suggestionsElement.children[suggestionsIndex];

    scrollToSuggestionItem(element, lastSuggestionItemSelected);
    selectSuggestionItem(element, lastSuggestionItemSelected);

    lastSuggestionItemSelected = element;
  }
}

function handlePhrases(input)
{
  const inputWords = input.split(/\s/);

  const suggestionsData = [];

  for (const phrase in registeredPhrases)
  {
    // split to array of words
    const phraseWords = phrase.split(/\s/);

    // array of the arguments passed the the phrase
    // const args = inputWords.slice(phraseWords.length);

    const { similarity, words } = comparePhrase(phraseWords, inputWords);

    // // if input equals phrase show the card
    // if (input === phrase)
    // {
    //   // TODO emit a callback if exists with the args (if the phrase similarity is fully written 100%)

    //   console.log('ping: ' + phrase);
    // }
    // // else hide it
    // else
    // {
    //   console.log('ping: ' + phrase);
    // }

    // // if the search bar is empty
    // if (input.length <= 0)
    // {
    //   // sort by most recently used
    //   // sort by most frequently used

    //   removeSuggestionsElement(registeredPhrases[phrase].element);
    // }

    suggestionsData.push(
      {
        phrase: phrase,
        words: words,
        similarity: similarity
      });
  }

  return suggestionsData;
}

/** sorts data based on similarity then takes the sorted data
* and use it to sort the suggestions element's items
* @param { { phrase: string, words: { highlighted: string, normal: string }[], similarity: number }[] } data
*/
function handleSuggestions(data)
{
  // sorts
  sort(
    data,
    (a, b) =>
    {
      if (a.similarity > b.similarity)
        return 1;
      else if (a.similarity < b.similarity)
        return -1;
      else
        return 0;
    })
    .then(() =>
    {
      const lastSuggestionCount = suggestionsElement.children.length;
      
      for (let i = 0; i < data.length; i++)
      {
        const element = registeredPhrases[data[i].phrase].element;

        // if there is no chance the input is similar to the phrase
        if (data[i].similarity > 0)
        {
          for (let x = 0, y = 0; x < data[i].words.length; x++, y += 2)
          {
            const word = data[i].words[x];
            
            setSuggestionItemText(element, word.highlighted, word.normal, y);
          }
          
          reorderSuggestionsElement(element);
        }
        else
        {
          removeSuggestionsElement(element);
        }
      }

      if (lastSuggestionCount <= 0 && suggestionsElement.children.length > 0 && suggestionsElement.contains(lastSuggestionItemSelected))
      {
        const index = Array.prototype.indexOf.call(suggestionsElement.children, lastSuggestionItemSelected);

        suggestionsIndex = index;

        scrollToSuggestionItem(lastSuggestionItemSelected, lastSuggestionItemSelected);
        selectSuggestionItem(lastSuggestionItemSelected, lastSuggestionItemSelected);
      }
      else if (suggestionsElement.children.length > 0)
      {
        resetSelectedSuggestionItem();

        const element = suggestionsElement.children[suggestionsIndex];
  
        selectSuggestionItem(element, lastSuggestionItemSelected);

        lastSuggestionItemSelected = element;
      }

      updateSuggestionsCount(suggestionsElement.children.length);
    });
}

function toggleSuggestionElement()
{
  suggestionsElement.classList.toggle('suggestionsActive');
}

/** @param { HTMLElement } element
 * @param { string } highlighted
 * @param { string } normal
 * @param { number } i
*/
function setSuggestionItemText(element, highlighted, normal, i)
{
  let highlightedElement, normalElement;

  if (element.children.length <= i)
  {
    highlightedElement = document.createElement('div');
    normalElement = document.createElement('div');
              
    highlightedElement.setAttribute('class', 'suggestionsItemHighlightedText');

    element.appendChild(highlightedElement);
    element.appendChild(normalElement);
  }
  else
  {
    highlightedElement = element.children[i];
    normalElement = element.children[i + 1];
  }

  highlightedElement.innerText = highlighted;
  normalElement.innerText = normal + ' ';
}

/** @param { string[] } phraseWords
* @param { string[] } inputWords
* @returns { { similarity: number, words: { highlighted: string, normal: string }[] } }
*/
function comparePhrase(phraseWords, inputWords)
{
  let similarity = 0;
  const words = [];

  for (let pi = 0, xi = 0; pi < phraseWords.length; pi++, xi++)
  {
    const input = inputWords[xi];
    const phrase = phraseWords[pi];

    if (phrase.startsWith(input))
    {
      // calculate similarity
      similarity +=
      
      Math.floor(
        (((100 * input.length) / phrase.length) / phraseWords.length) +
        (100 * (phrase.length - (phrase.length - input.length)))
      );
      
      // add the highlighted part, add the rest of the word that is not highlighted
      words.push(
        {
          highlighted: inputWords[xi],
          normal: phraseWords[pi].replace(inputWords[xi], '')
        });
    }
    else
    {
      // nothing is highlighted just add the phrase
      words.push(
        {
          highlighted: '',
          normal: phraseWords[pi]
        });

      // go through the other phrase words with current input word
      xi -= 1;
    }
  }

  return { similarity: similarity, words: words };
}

/** @param { any[] } array
* @param { (a, b) => number } array
*/
function sort(array, compare)
{
  return new Promise((resolve) =>
  {
    array.sort(compare);

    resolve();
  });
}

/** @param { HTMLElement } element
* @param { HTMLElement } lastElement
*/
function selectSuggestionItem(element, lastElement)
{
  if (lastElement)
    lastElement.classList.remove('suggestionsItemSelected');
  
  element.classList.add('suggestionsItemSelected');
}

/** @param { HTMLElement } element
* @param { HTMLElement } lastElement
*/
function scrollToSuggestionItem(element, lastElement)
{
  requestAnimationFrame(() =>
  {
    if (lastElement)
      lastElement.scrollIntoView({
        behavior: 'instant',
        inline: 'nearest',
        block: 'nearest'
      });

    element.scrollIntoView({
      behavior: 'smooth',
      inline: 'nearest',
      block: 'nearest'
    });
  });
}

function resetSelectedSuggestionItem()
{
  requestAnimationFrame(() =>
  {
    suggestionsElement.scroll({
      behavior: (lastInput.length <= 0) ? 'instant' : 'smooth',
      left: 0,
      top: 0
    });
  });

  suggestionsIndex = 0;
}

/** @param { HTMLDivElement } element
*/
function reorderSuggestionsElement(element)
{
  suggestionsElement.insertBefore(element, suggestionsElement.firstChild);
}

/** @param { HTMLDivElement } element
*/
function removeSuggestionsElement(element)
{
  if (suggestionsElement.contains(element))
    suggestionsElement.removeChild(element);
}

/** @param { number } count
*/
function updateSuggestionsCount(count)
{
  const max = getComputedStyle(suggestionsElement).getPropertyValue('--max-suggestions-count');

  if (max)
    count = Math.min(max, count);

  suggestionsElement.style.setProperty('--suggestions-count', count);
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

/** @param { string } phrase
* @param { (...args: string[]) => void } [callback]
* @returns { Card }
*/
export function registerPhrase(phrase, callback)
{
  phrase = standard(phrase);

  if (phrase.length <= 0)
    throw new Error('you can\'t register empty phrases');

  // each phrase can only be registered once
  if (!registeredPhrases[phrase])
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

    const element = document.createElement('div');

    element.setAttribute('class', 'suggestionsItem');

    registeredPhrases[phrase] =
    {
      card: card,
      callback: callback,
      element: element
    };

    return card;
  }
  else
  {
    throw new Error('The phrase is already registered');
  }
}

/** @param { Card } card
*/
export function unregisterPhrase(card)
{
  if (card.isPhrased && registeredPhrases[card.isPhrased])
  {
    // remove the auto-complete item
    removeSuggestionsElement(registeredPhrases[card.isPhrased].element);

    // delete it from the registered phrases array
    delete registeredPhrases[card.isPhrased];

    // clone card with a removed isPhrased property
    const clone = Object.assign(createCard(), card, { isPhrased: undefined });

    return clone;
  }
  else
  {
    throw new Error('the card is not registered to any phrases');
  }
}

/** @param { string } phrase
*/
export function isRegisteredPhrase(phrase)
{
  return (registeredPhrases[standard(phrase)] !== undefined);
}

/** @param { string } phrase
* @param { string[] } args
*/
export function emitPhraseCallback(phrase, ...args)
{
  registeredPhrases[phrase].callback(...args);
}

/** set the text in the search bar (if the search bar is empty)
* @param { string } text
*/
export function setPlaceholder(text)
{
  inputElement.placeholder = text;
}