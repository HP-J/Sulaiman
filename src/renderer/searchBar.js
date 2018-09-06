import { on, emit } from './loader.js';

import Card, { createCard } from './card.js';

/** @type { HTMLInputElement }
*/
export let inputElement;

/** @type { HTMLInputElement }
*/
export let autoCompleteElement;

/**
* @type { Object.<string, { card: Card, callback: Function, element: HTMLDivElement } > }
*/
const registeredPhrases = {};

/** create and append the search bar and card-space
*/
export function appendSearchBar()
{
  inputElement = document.createElement('input');
  inputElement.setAttribute('id', 'searchBar');
  document.body.appendChild(inputElement);

  autoCompleteElement = document.createElement('div');
  autoCompleteElement.setAttribute('id', 'autoComplete');
  document.body.appendChild(autoCompleteElement);

  on.focus(focus);
  on.blur(blur);

  inputElement.oninput = oninput;
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
  setInput('');
}

/** gets called when the user changes the input value
*/
function oninput()
{
  const input = standard(inputElement.value);

  emit.input(input);

  const autoCompleteData = handlePhrases(input);

  handleAutoComplete(autoCompleteData);
}

function handlePhrases(input)
{
  const inputWords = input.split(/\s/);

  const autoCompleteData = [];

  for (const phrase in registeredPhrases)
  {
    // split to array of words
    const phraseWords = phrase.split(/\s/);
  
    // array of the arguments passed the the phrase
    const args = inputWords.slice(phraseWords.length);
  
    const { percentage, comparedOutput } = comparePhrase(phraseWords, inputWords);
  
    if (percentage > 0)
    {
      // // if percentage is 100% show the card
      // if (percentage >= 100)
      // {
      //   // TODO emit a callback if exists with the args (if the phrase percentage is fully written 100%)
  
      //   console.log('ping: ' + phrase);
      // }
      // // if percentage is less than 100% hide the card
      // else
      // {
      //   console.log('ping: ' + phrase);
      // }
  
      autoCompleteData.push(
        {
          phrase: phrase,
          autoCompleteWords: comparedOutput,
          percentage:
            // if input words count is higher the the phrase words count, damage the percentage
            percentage / Math.max(((inputWords.length + 1) - phraseWords.length), 1)
        });
    }
    else
    {
      // if percentage is 0%, hide the item
      removeAutoCompleteItem(registeredPhrases[phrase].element);
    }
  }

  return autoCompleteData;
}

/** @param { { phrase: string, autoCompleteWords: string[], percentage: number }[] } data
*/
function handleAutoComplete(data)
{
  sort(
    data,
    (a, b) =>
    {
      if (a.percentage > b.percentage)
        return 1;
      else if (a.percentage < b.percentage)
        return -1;
      else
        return 0;
    })
    .then(() =>
    {
      for (let i = 0; i < data.length; i++)
      {
        const element = registeredPhrases[data[i].phrase].element;
  
        for (let x = 0; x < data[i].autoCompleteWords.length; x++)
        {
          const word = data[i].autoCompleteWords[x];
          
          element.children[x].innerText = word;
        }
    
        addAutoCompleteElement(element);
      }
    });
}

function comparePhrase(phraseWords, inputWords)
{
  let percentage = 0;
  const comparedOutput = [];

  for (let i = 0; i < phraseWords.length; i++)
  {
    if (phraseWords[i].startsWith(inputWords[i]))
    {
      // if it's not the first word add a space
      comparedOutput.push(((i > 0) ? ' ' : '') + inputWords[i]);
  
      // calculate similarity
      percentage += Math.floor(
        ((100 * inputWords[i].length) / phraseWords[i].length) / phraseWords.length
      );
    }
    else
    {
      // if it's not the first word add a space
      comparedOutput.push((i > 0) ? ' ' : '');
    }
  
    // add the rest of the word that is not included
    comparedOutput.push(phraseWords[i].replace(inputWords[i], ''));
  }

  return { percentage, comparedOutput };
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

function addAutoCompleteElement(element)
{
  autoCompleteElement.insertBefore(element, autoCompleteElement.firstChild);
}

function removeAutoCompleteItem(element)
{
  if (autoCompleteElement.contains(element))
    autoCompleteElement.removeChild(element);
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

    // we want to have 100% control over when cards are shown
    // and removed from the dom, by setting a read-only property
    // that is checked by all append and remove apis, we can accomplish that
    Object.defineProperty(card, 'isPhrased',
      {
        value: phrase,
        writable: false
      });

    const element = document.createElement('div');
    const phraseWords = phrase.split(/\s/);
    
    element.setAttribute('class', 'autoCompleteItem');

    for (let i = 0; i < phraseWords.length; i++)
    {
      const highlighterElement = document.createElement('span');
      highlighterElement.setAttribute('class', 'autoCompleteItemHighlighter');

      element.appendChild(highlighterElement);
      element.appendChild(document.createElement('span'));
    }

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
    removeAutoCompleteItem(registeredPhrases[card.isPhrased].element);
    
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

/** set the text in the search bar
* @param { string } text
*/
export function setInput(text)
{
  inputElement.value = text;

  oninput();
}

/** set the text in the search bar (if the search bar is empty)
* @param { string } text
*/
export function setPlaceholder(text)
{
  inputElement.placeholder = text;
}