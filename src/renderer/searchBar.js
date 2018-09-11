import { on } from './loader.js';

import Card, { createCard } from './card.js';

/** @type { HTMLInputElement }
*/
let inputElement;

/** @type { HTMLDivElement }
*/
let suggestionsElement;

/** @type { Object.<string, { card: Card, args: string[], shown: Function, entered: Function }> }
*/
const registeredPhrases = {};

/** @type { Object.<string, HTMLDivElement> }
*/
const searchables = {};

let activePhrase = '';

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

/** gets called when the user changes the input value
*/
function oninput()
{
  const input = standard(inputElement.value);

  if (input === lastInput)
    return;

  lastInput = input;

  if (activePhrase)
  {
    document.body.removeChild(registeredPhrases[activePhrase].card.domElement);

    activePhrase = '';
  }

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
}

/** gets called on key downs while the search bar is focused
* @param { KeyboardEvent } event
*/
function onkeydown(event)
{
  if (event.key === 'ArrowUp')
  {
    event.preventDefault();
    suggestionsIndex = Math.min(Math.max(suggestionsIndex - 1, 0), suggestionsElement.children.length - 1);
  }
  else if (event.key === 'ArrowDown')
  {
    suggestionsIndex = Math.min(Math.max(suggestionsIndex + 1, 0), suggestionsElement.children.length - 1);
  }
  else if (event.key === 'ArrowRight' && lastSuggestionItemSelected)
  {
    inputElement.value = lastSuggestionItemSelected.searchable;

    oninput();
  }
  else if (event.key === 'Enter')
  {
    inputElement.blur();

    if (activePhrase && registeredPhrases[activePhrase].entered)
    {
      if (registeredPhrases[activePhrase].entered())
        clear();
    }
  }

  if (suggestionsElement.children.length > 0)
  {
    const element = suggestionsElement.children[suggestionsIndex];

    scrollToSuggestionItem(element, lastSuggestionItemSelected);
    selectSuggestionItem(element, lastSuggestionItemSelected);

    lastSuggestionItemSelected = element;
  }
}

/** handle phrases their cards and callbacks, then compares them with
* the input and returns an array with all the data
* @param { string } input aka the text in the search bar
*/
function handlePhrases(input)
{
  const inputWords = input.split(/\s/);

  const suggestionsData = [];

  for (const searchable in searchables)
  {
    // split to array of words
    const searchableWords = searchable.split(/\s/);

    // compare the searchable with the input
    const { similarity, words } = compareStrings(searchableWords, inputWords);

    const phrase = searchableWords[0];
    const phraseObj = registeredPhrases[phrase];

    // if input equals phrase show the card and emit the callback
    if (input.startsWith(searchable))
    {
      if (phraseObj.shown)
        phraseObj.shown(
          searchable.replace(phrase, '').trim(),
          input.replace(searchable, '').trim()
        );

      document.body.appendChild(phraseObj.card.domElement);

      activePhrase = phrase;
    }

    // push the data we got about the two compared string to the data array
    suggestionsData.push(
      {
        searchable: searchable,
        words: words,
        similarity: similarity
      });
  }

  // finally return the data array
  return suggestionsData;
}

/** sorts data based on similarity then takes the sorted data
* and use it to sort the suggestions element's items
* @param { { searchable: string, words: { highlighted: string, normal: string }[], similarity: number }[] } data
*/
function handleSuggestions(data)
{
  // sorts the data by similarity, which puts the higher on top of the list
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
    // after the sorting is done
    .then(() =>
    {
      // the number of suggestion on the list, before we reorder or remove any of them
      const lastSuggestionCount = suggestionsElement.children.length;
      
      // loop through the sorted data from the lowest to the highest
      for (let i = 0; i < data.length; i++)
      {
        // the suggestion element belonging to the searchable
        const element = searchables[data[i].searchable];

        // if the input is similar in any way to the searchable
        if (data[i].similarity > 0)
        {
          // loop through the compared words
          for (let x = 0, y = 0; x < data[i].words.length; x++, y += 2)
          {
            const word = data[i].words[x];
            
            // set the word in the element
            setSuggestionItemWord(element, word.highlighted, word.normal, y);
          }
          
          // moves the suggestion element to the top of the list
          reorderSuggestionsElement(element);
        }
        // if there is no chance the input is similar to the phrase
        else
        {
          // remove the suggestion element from the list
          removeSuggestionsElement(element);
        }
      }

      // if the last suggestion count was 0 the current the higher than 0
      // if the last selected suggestion item still exists on the list then
      // selected it again and scroll to it
      if (lastSuggestionCount <= 0 && suggestionsElement.children.length > 0 && suggestionsElement.contains(lastSuggestionItemSelected))
      {
        const index = Array.prototype.indexOf.call(suggestionsElement.children, lastSuggestionItemSelected);

        suggestionsIndex = index;

        scrollToSuggestionItem(lastSuggestionItemSelected, lastSuggestionItemSelected);
        selectSuggestionItem(lastSuggestionItemSelected, lastSuggestionItemSelected);
      }
      // else reset the selected suggestion item to the first on the list and scroll to it
      else if (suggestionsElement.children.length > 0)
      {
        resetSelectedSuggestionItem();

        const element = suggestionsElement.children[suggestionsIndex];
  
        selectSuggestionItem(element, lastSuggestionItemSelected);

        lastSuggestionItemSelected = element;
      }

      // updates the css property that belongs to the suggestions count
      updateSuggestionsCount(suggestionsElement.children.length);
    });
}

/** toggle the css class 'suggestionsActive' on the suggestions list element
 */
function toggleSuggestionElement()
{
  suggestionsElement.classList.toggle('suggestionsActive');
}

/** compares two strings are returns their similarity and which parts of then should be highlighted
* @param { string[] } searchableWords
* @param { string[] } inputWords
* @returns { { similarity: number, words: { highlighted: string, normal: string }[] } }
*/
function compareStrings(searchableWords, inputWords)
{
  let similarity = 0;
  const words = [];

  for (let pi = 0, xi = 0; pi < searchableWords.length; pi++, xi++)
  {
    const one = inputWords[xi];
    const two = searchableWords[pi];

    if (two.startsWith(one))
    {
      // calculate similarity
      similarity +=
      
      Math.floor(
        (((100 * one.length) / two.length) / searchableWords.length) +
        (100 * (two.length - (two.length - one.length)))
      );
      
      // add the highlighted part, add the rest of the word that is not highlighted
      words.push(
        {
          highlighted: inputWords[xi],
          normal: searchableWords[pi].replace(inputWords[xi], '')
        });
    }
    else
    {
      // nothing is highlighted just add the phrase
      words.push(
        {
          highlighted: '',
          normal: searchableWords[pi]
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

/** sets a word in a suggestion item
* @param { HTMLElement } element the suggestion element
* @param { string } highlighted the part that should be highlighted
* @param { string } normal the part that should not be highlighted
* @param { number } i the word index
*/
function setSuggestionItemWord(element, highlighted, normal, i)
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

/** selects a suggestion element
* @param { HTMLElement } element
* @param { HTMLElement } lastElement
*/
function selectSuggestionItem(element, lastElement)
{
  if (lastElement)
    lastElement.classList.remove('suggestionsItemSelected');
  
  element.classList.add('suggestionsItemSelected');
}

/** scrolls to a suggestion element to make it visible
* @param { HTMLElement } element
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

/** resets the selected suggestion item to the first on the list
*/
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

/** puts a suggestion element on top of the list
* @param { HTMLDivElement } element
*/
function reorderSuggestionsElement(element)
{
  suggestionsElement.insertBefore(element, suggestionsElement.firstChild);
}

/** removes a suggestion element from the list
* @param { HTMLDivElement } element
*/
function removeSuggestionsElement(element)
{
  if (suggestionsElement.contains(element))
    suggestionsElement.removeChild(element);
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
* @param { string[] } [args]
* @param { (argument: string, value: string) => void } [shown]
* @param { () => boolean } [entered]
* @returns { Card }
*/
export function registerPhrase(phrase, args, shown, entered)
{
  phrase = standard(phrase);

  if (phrase.split(/\s/).length > 1)
    throw new Error('The phrase can only have one word, additional words can be set as arguments');

  if (registeredPhrases[phrase])
    throw new Error('The phrase is already registered');

  if (!args || args.length <= 0)
    args = [ '' ];

  const card = createCard();

  // we want to have control over when cards are shown
  // and removed from the dom, by setting a read-only property
  // that is checked by all append and remove apis, we can accomplish that
  Object.defineProperty(card, 'isPhrased',
    {
      value: phrase,
      writable: false
    });

  for (let i = 0; i < args.length; i++)
  {
    const argument = standard(phrase + ' ' + args[i]);

    if (argument === phrase && args.length > 1)
      throw new Error('Empty argument phrases can\'t have more than the empty argument');
      
    if (searchables[argument])
      continue;

    args[i] = argument;

    const element = document.createElement('div');

    element.setAttribute('class', 'suggestionsItem');
    element.searchable = argument;

    searchables[argument] = element;
  }

  registeredPhrases[phrase] =
  {
    card: card,
    args: args,
    shown: shown,
    entered: entered
  };

  return card;
}

/** @param { Card } card
* @returns { Card }
*/
export function unregisterPhrase(card)
{
  if (card.isPhrased && registeredPhrases[card.isPhrased])
  {
    const phrase = card.isPhrased;
    const phraseObj = registeredPhrases[phrase];

    // remove all suggestion element that belongs to the args
    for (let i = 0; i < phraseObj.args.length; i++)
    {
      // remove the suggestion element
      removeSuggestionsElement(searchables[phraseObj.args[i]].element);
    }

    // delete it from the registered phrases array
    delete registeredPhrases[phrase];

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