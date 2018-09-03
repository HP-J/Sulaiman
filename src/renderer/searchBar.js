import { on, emit, registeredPhrases } from './loader.js';

import Card from './card.js';

/** @type { HTMLInputElement }
*/
export let input;

/** create and append the search bar and card-space
*/
export function append()
{
  input = document.createElement('input');
  input.setAttribute('id', 'searchBar');
  document.body.appendChild(input);

  on.focus(onfocus);
  on.blur(onblur);

  input.oninput = oninput;
}

/** gets called every time sulaiman regain focus
*/
function onfocus()
{
  // empty the search bar every time the sulaiman regain focus
  input.focus();
}

/** gets called every time sulaiman regain focus
*/
function onblur()
{
  // empty the search bar
  setInput('');
}

/** gets called when the user changes the input value
*/
function oninput()
{
  emit.input(input.value);

  const query = input.value.toLowerCase();

  for (const phrase in registeredPhrases)
  {
    const registered = registeredPhrases[phrase];

    if (registered.isSynonym)
      continue;

    let probability = getProbability(phrase, query);

    if (registered.synonym)
    {
      const synonymProbability = getProbability(registered.synonym, query);

      if (synonymProbability > probability)
        probability = synonymProbability;
    }
    
    setTimeout(() =>
    {
      emit.phrase(phrase, input.value, probability);
    }, 100 - probability);
  }
}

/** @param { string } phrase
* @param { string } query
*/
function getProbability(phrase, query)
{
  // if the phrase is taller check the phrase for query
  if (phrase.length >= query.length && phrase.includes(query))
    return ((100 * query.length) / phrase.length);
  // if the query is taller check the query for phrase
  else if (query.length > phrase.length && query.includes(phrase))
    return ((100 * phrase.length) / query.length);
  else
    return 0;
}

/** set the text in the search bar
* @param { string } text
*/
export function setInput(text)
{
  input.value = text;

  oninput();
}

/** set the text in the search bar (if the search bar is empty)
* @param { string } text
*/
export function setPlaceholder(text)
{
  input.placeholder = text;
}