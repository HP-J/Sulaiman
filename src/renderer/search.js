import { remote } from 'electron';

import { join } from 'path';

import { on } from './loader.js';

import { registeredPrefixes } from './prefix.js';

const { isDebug } = remote.require(join(__dirname, '../main/window.js'));

/** @typedef { import('./card.js').default } Card
*/

/** @typedef { import('./prefix.js').default } Prefix
*/

/** @typedef { Object } CompareObject
 * @property { HTMLElement } element
* @property { string } input
* @property { string } target
* @property { number } similarity
*/

/** @type { HTMLInputElement }
*/
const inputElement = document.body.querySelector('input.searchBar');

/** @type { HTMLDivElement }
*/
const searchItemsElement = document.body.querySelector('.searchItemsList');

let lastInput = '';

let selectIndex = 0;

/** create and append the search bar and card-space
*/
export function initSearchBar()
{
  inputElement.oninput = oninput;
  inputElement.onkeydown = onkeydown;

  inputElement.onfocus = () =>
  {
    toggleSearchItemsListElement();
    
    oninput();
  };
  
  inputElement.onblur = toggleSearchItemsListElement;

  on.focus(focus);
  on.blur(blur);
  
  oninput();
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
  const input = trimString(inputElement.value);

  if (input === lastInput)
    return;

  lastInput = input;

  // on input scroll to top of the window
  scrollToTop();

  // remove old suggestion elements
  while (searchItemsElement.firstChild)
  {
    searchItemsElement.removeChild(searchItemsElement.firstChild);
  }

  if (!input)
  {
    // deactivate any active prefixes
    search();
  }
  else
  {
    // show new suggestion, and activate prefixes
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

    // scroll to top of the window
    scrollToTop();

    selectItem(-1);
  }
  else if (event.code === 'ArrowDown')
  {
    event.preventDefault();

    // scroll to top of the window
    scrollToTop();

    selectItem(1);
  }
  else if (event.code === 'ArrowRight')
  {
    if (
      (inputElement.selectionEnd + 1 > inputElement.value.length) &&
      (searchItemsElement.children.length > selectIndex)
    )
      setInput(searchItemsElement.children[selectIndex].value || searchItemsElement.children[selectIndex].innerText);
  }
  else if (event.code === 'Enter')
  {
    if (searchItemsElement.children.length > selectIndex)
    {
      /** @type { { input: "auto-complete" | "clear", searchBar: "select-input" | "blur" } }
      */
      let options;

      // prefix enter event

      const prefix = searchItemsElement.children[selectIndex].ref.prefix;

      const prefixObj = registeredPrefixes[prefix];

      options = prefixObj.emit.enter(
        searchItemsElement.children[selectIndex],
        searchItemsElement.children[selectIndex].ref.input,
        searchItemsElement.children[selectIndex].ref.target,
      );

      if (!options || typeof options !== 'object')
        options = { input: 'auto-complete', searchBar: 'blur' };

      if (options.input === 'auto-complete')
        setInput(searchItemsElement.children[selectIndex].value || searchItemsElement.children[selectIndex].innerText);
      else if (options.input === 'clear')
        setInput('');

      if (options.searchBar === 'select-input')
        inputElement.select();
      else if (options.searchBar === 'blur')
        inputElement.blur();
    }
  }
}

/** @param { number } indexDiff
*/
function selectItem(indexDiff)
{
  if (searchItemsElement.children.length <= 0)
    return;

  const nextIndex = Math.min(Math.max(selectIndex + indexDiff, 0), searchItemsElement.children.length - 1);

  const nextElement = searchItemsElement.children[nextIndex];
  const currentElement = searchItemsElement.children[selectIndex];

  if (currentElement && nextElement !== currentElement && currentElement.classList.contains('searchItemSelected'))
  {
    currentElement.classList.remove('searchItemSelected');

    requestAnimationFrame(() =>
    {
      currentElement.scrollIntoView({
        behavior: 'instant',
        inline: 'nearest',
        block: 'nearest'
      });
    });
  }

  if (nextElement && !nextElement.classList.contains('searchItemSelected'))
  {
    nextElement.classList.add('searchItemSelected');

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
    /** @param { Prefix } prefixObj
    * @param { CompareObject } searchItem
    */
    function process(prefixObj, searchItem)
    {
      if (searchItem.similarity > 0)
      {
        // prevent duplicates
        if (!dubObj[searchItem.target])
        {
          dubObj[searchItem.target] = true;

          fuseSearchItemWithElement(prefixObj, searchItem.element, searchItem.input, searchItem.target);
          
          searchItems.push(searchItem);

          return true;
        }
        else
        {
          return false;
        }
      }
      else
      {
        return false;
      }
    }

    /** @type { CompareObject[] }
    */
    const searchItems = [];

    const dubObj = {};

    // search all prefixes are their arguments
    for (const prefix in registeredPrefixes)
    {
      const prefixObj = registeredPrefixes[prefix];

      const flexibleSuggestions = prefixObj.getSuggestions();
      const fixedSuggestions = prefixObj.getFixedSuggestions();

      let latestMatch;

      // if search input isn't empty
      if (input)
      {
        let prefixSearchItem;

        // if the prefix is a string
        if (prefixObj.prefixType === 'string')
        {
          // only compare with the first word
          prefixSearchItem = compareStrings(input, prefixObj.prefix);

          // the target can't be the prefix itself
          prefixSearchItem.target = undefined;
        }
        // match input to a regex
        else
        {
          const match = input.match(prefixObj.prefix);

          let element;
          
          if (match)
          {
            // create an element for the suggestion item
            element = document.createElement('div');

            // set the element as search item
            element.setAttribute('class', 'searchItem');

            element.innerText = match.join('');
          }

          prefixSearchItem = {
            element: element,
            similarity: (match) ? 1 : 0,
            input: input,
            target: match
          };
        }

        // add the prefix itself to the search items
        if ((prefixObj.prefixType === 'regexp' && prefixSearchItem.similarity >= 1) ||
           (prefixSearchItem.similarity > 0 && fixedSuggestions.length <= 0))
        {
          if (process(prefixObj, prefixSearchItem) && prefixSearchItem.similarity >= 1)
            latestMatch = prefixSearchItem;

          if (prefixSearchItem.similarity >= 1)
          {
            // flexible suggestions only appear if the prefix is fully matched
            for (let i = 0; i < flexibleSuggestions.length; i++)
            {
              const searchItem = compareStrings(input, `${prefixObj.prefix} ${flexibleSuggestions[i]}`);

              if (process(prefixObj, searchItem) && searchItem.similarity >= 1)
                latestMatch = searchItem;
            }
          }
        }
        // add flexible suggestions and/or fixed suggestions to the search items
        else if (fixedSuggestions.length > 0)
        {
          // fixed suggestions always appear as search items
          for (let i = 0; i < fixedSuggestions.length; i++)
          {
            // this works because the prefix is always string
            const searchItem = compareStrings(input, `${prefixObj.prefix} ${fixedSuggestions[i]}`);

            if (searchItem.similarity >= 1)
            {
              let any = false;

              // flexible suggestions only appear if the prefix (and/or extra) is fully matched
              flexibleSuggestions.filter((value) => value.startsWith(fixedSuggestions[i])).forEach((value) =>
              {
                any = true;

                const searchItem = compareStrings(input, `${prefixObj.prefix} ${value}`);

                if (process(prefixObj, searchItem) && searchItem.similarity >= 1)
                  latestMatch = searchItem;
              });

              if (!any)
              {
                process(prefixObj, searchItem);

                latestMatch = searchItem;
              }
            }
            else
            {
              process(prefixObj, searchItem);
            }
          }
        }
      }

      // if there is a match activate the prefix
      if (latestMatch)
      {
        activatePrefix(
          prefixObj,
          latestMatch.element,
          latestMatch.input,
          latestMatch.target
        );
      }
      // if not and the prefix is still active then deactivate it
      else if (prefixObj.active())
      {
        deactivatePrefix(prefixObj);
      }
    }

    // sort all compare objects based on their similarity
    searchItems.sort((a, b) =>
    {
      if (a.similarity > b.similarity)
        return -1;
      else if (a.similarity < b.similarity)
        return 1;
      else
        return 0;
    });

    // add the new search items to dom
    for (let i = 0; i < searchItems.length; i++)
    {
      searchItemsElement.appendChild(searchItems[i].element);
    }

    resolve();
  });
}

/** @param { Prefix } prefix
* @param { HTMLElement } searchItemElement
* @param { string } extra
* @param { string } suggestion
*/
function activatePrefix(prefix, searchItemElement, extra, suggestion)
{
  if (prefix.emit.activate(prefix.card, searchItemElement, extra, suggestion) !== false)
  {
    if (!document.body.contains(prefix.card.domElement))
      document.body.insertBefore(prefix.card.domElement, document.body.children[3]);
  }
}

/** @param { Prefix } prefix
*/
function deactivatePrefix(prefix)
{
  if (document.body.contains(prefix.card.domElement))
    document.body.removeChild(prefix.card.domElement);
}

/** string comparison algorithm
* @param { string } input
* @param { string } target
*/
function compareStrings(input, target)
{
  const inputSplit = input.toLowerCase().split('');
  const targetSplit = target.toLowerCase().split('');

  let matchingLetters = 0;

  for (let i = 0; i < targetSplit.length; i++)
  {
    for (let x = 0; x < inputSplit.length; x++)
    {
      if (inputSplit[x] === targetSplit[i])
      {
        inputSplit.splice(x, 1);
        
        matchingLetters = matchingLetters + 1;

        break;
      }
    }
  }

  let element;

  if (matchingLetters > 0)
  {
    // create an element for the suggestion item
    element = document.createElement('div');

    // set the element as search item
    element.setAttribute('class', 'searchItem');

    // always uppercase the first letter
    element.innerText = target.charAt(0).toUpperCase() + target.slice(1);
  }

  return {
    element: element,
    input: input.substring(input.indexOf(' ')).trim(),
    target: target.substring(target.indexOf(' ')).trim(),
    similarity: matchingLetters / targetSplit.length
  };
}

/** @param { Prefix } prefix
* @param { HTMLElement } element
* @param { string } input
* @param { string } target
*/
function fuseSearchItemWithElement(prefix, element, input, target)
{
  Object.defineProperty(element, 'ref', {
    value: {
      prefix: prefix.prefix,
      input: input,
      target: target
    },
    writable: false
  });
}

/** toggle the search items list element
 */
function toggleSearchItemsListElement()
{
  searchItemsElement.classList.toggle('searchItemsListActive');
}

function scrollToTop()
{
  requestAnimationFrame(() => window.scroll({ top: 0, left: 0, behavior: 'smooth' }));
}

/** update a string to be the standard the app uses for searching
* @param { string } s the string you want to update
*/
export function trimString(s)
{
  // replace any newlines or extra whitespace with only one space,
  // so we can split words correctly

  // remove any unnecessary whitespace from the beginning and the ending of the string,
  // just to make sure to get the expected result

  return s.replace(/\s+|\n/g, ' ').trim();
}

/** set the text in the search bar
* @param { string } input
*/
export function setInput(input)
{
  inputElement.value = input;

  oninput();
}

/** [theme-only function] set the text in the search bar (if the search bar is empty)
* @param { string } text
*/
export function setPlaceholder(text)
{
  inputElement.placeholder = text;
}