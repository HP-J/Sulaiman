import { on, emit } from './loader.js';

import Card, { createCard } from './card.js';

/** @type { HTMLInputElement }
*/
export let inputElement;

/** @type { HTMLInputElement }
*/
export let suggestionsElement;

/**
* @type { Object.<string, { card: Card, callback: Function, element: HTMLDivElement } > }
*/
const registeredPhrases = {};

// /** @type { NodeJS.Timer }
// */
// let suggestionsTimer = undefined;

let suggestionsIndex = 0;

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

  on.focus(focus);
  on.blur(blur);
  on.ready(oninput);
}

/** gets called every time sulaiman regain focus
*/
function focus()
{
  // empty the search bar every time the sulaiman regain focus
  inputElement.focus();
}

/** gets called every time sulaiman regain focus
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

  console.log('----------');
  console.log(input);

  suggestionsIndex = 0;

  const suggestionsData = handlePhrases(input);

  handleSuggestions(suggestionsData);

  // refreshSuggestionsTimer();
}

/** @param { KeyboardEvent } event
*/
function onkeydown(event)
{
  // if (suggestionsElement.children.length <= 0)
  //   return;

  // if (event.key === 'ArrowUp')
  // {
  //   suggestionsIndex = Math.min(Math.max(suggestionsIndex - 1, 0), suggestionsElement.children.length - 1);
  // }
  // else if (event.key === 'ArrowDown')
  // {
  //   suggestionsIndex = Math.min(Math.max(suggestionsIndex + 1, 0), suggestionsElement.children.length - 1);
  // }

  // const rect = suggestionsElement.children[suggestionsIndex].getBoundingClientRect();

  // suggestionsElement.children[suggestionsIndex].scrollIntoView(
  //   {
  //     behavior: 'smooth',
  //     block: 'center',
  //     inline: 'nearest'
  //   });

  // console.log(suggestionsIndex);
}

function refreshSuggestionsTimer()
{
  // clearTimeout(suggestionsTimer);

  // showsuggestions();

  // suggestionsTimer = setTimeout(hidesuggestions, 650);
}

function showSuggestions()
{
  // if (!suggestionsElement.classList.contains('suggestionsActive'))
  //   suggestionsElement.classList.add('suggestionsActive');
}

function hideSuggestions()
{
  // suggestionsElement.classList.remove('suggestionsActive');
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
    const args = inputWords.slice(phraseWords.length);

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

    // if there is no chance the input is similar to the phrase
    if (similarity <= 0)
    {
      removeSuggestionsElement(registeredPhrases[phrase].element);
    }
    // if there IS a chance that the input is similar to the phrase
    else
    {
      // const damagedsimilarity =  similarity / Math.max(((inputWords.length + 1) - phraseWords.length), 1);

      console.log(similarity + '% ' + phrase);

      suggestionsData.push(
        {
          phrase: phrase,
          words: words,
          similarity: similarity
        });
    }
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
      for (let i = 0; i < data.length; i++)
      {
        const element = registeredPhrases[data[i].phrase].element;

        while (element.firstChild)
          element.removeChild(element.firstChild);

        for (let x = 0; x < data[i].words.length; x++)
        {
          const word = data[i].words[x];
          
          const highlighter = document.createElement('span');
          const normal = document.createElement('span');
          
          highlighter.innerText = word.highlighted;
          normal.innerText = word.normal + ' ';
          
          highlighter.setAttribute('class', 'suggestionsItemHighlighter');

          element.appendChild(highlighter);
          element.appendChild(normal);
        }

        addSuggestionsElement(element);
      }
    });
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
    if (phraseWords[pi].startsWith(inputWords[xi]))
    {
      // calculate similarity
      similarity +=
      
      Math.floor(
        ((100 * inputWords[xi].length) / phraseWords[pi].length) / phraseWords.length
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

function addSuggestionsElement(element)
{
  suggestionsElement.insertBefore(element, suggestionsElement.firstChild);
}

function removeSuggestionsElement(element)
{
  if (suggestionsElement.contains(element))
    suggestionsElement.removeChild(element);
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