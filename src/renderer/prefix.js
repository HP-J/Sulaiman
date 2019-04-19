import Events from './events.js';

import { getCaller } from './loader.js';

import { createCard } from './card.js';
import { trimString } from './search.js';
import { containsCard } from './api.js';

/** @typedef { import('./card.js').default } Card
*/

/** @typedef { Object } PrefixOptions
* @property { string | RegExp } prefix
* @property { Card } [card]
*/

/** @type { Object<string, Prefix> }
*/
export const registeredPrefixes = {};

/** create a new card
* @param { PrefixOptions } options
*/
export function createPrefix(options)
{
  return new Prefix(options);
}

/** returns true if the same prefix is registered already, false if it's not
* @param { string | RegExp } prefix
* @returns { Promise<boolean> }
*/
export function isRegisteredPrefix(prefix)
{
  const isString = (typeof prefix === 'string');

  // if the prefix is not actually a string type, throw an error
  if (!isString && !(prefix instanceof RegExp))
    throw new TypeError('the prefix type is not a string or a regex, it should be one of those two');
  
  // don't register an empty prefix
  if (isString && !prefix)
    throw new Error('the prefix is empty');

  // just to standardize the auto-complete/suggestions and not to make them a hell to read or theme
  if (isString && prefix.match(/[\u0000-\u007F]/g).length !== prefix.length)
    throw new Error('the prefix must all be in basic latin');

  // just to standardize the auto-complete/suggestions and not to make them a hell to read or theme
  if (isString && prefix !== prefix.toLowerCase())
    throw new Error('the prefix must all be in lowercase');

  // if the prefix has any unnecessary whitespace or ant newlines, throw an error
  if (isString && prefix !== trimString(prefix))
    throw new Error('the prefix must not have any unnecessary whitespace and also must not have any newlines');
    
  return registeredPrefixes[prefix] !== undefined;
}

export default class Prefix
{
  /** @param { PrefixOptions } options
  */
  constructor(options)
  {
    const { file, functionName } = getCaller(3);

    if (file !== __filename || !(functionName === createPrefix.name))
      throw new TypeError('Illegal Constructor');

    /** the registered prefix
    * @type { string | RegExp }
    */
    this.prefix = '';
    
    /** the prefix type wither its string or regexp
    * @type { 'string' | 'regexp' }
    */
    this.prefixType = '';

    /** if the prefix card is currently active (on-screen)
    * @type { () => boolean }
    */
    this.active = false;
    
    /** the prefix card appears when the prefix/arguments
    *   are fully written in the search bar
    */
    this.card = options.card || createCard();

    // prefix events

    const events = new Events();

    this.on = {
      /** emits when the prefix (and an argument) is fully matched,
      * should return a boolean that equals true to show the prefix's card or equals false to not show it, default is true
      * @param { (card: Card, searchItem: HTMLElement, extra: string, suggestion: string) => boolean } callback
      */
      activate: (callback) => events.addListener('activate', callback),
      /** emits when the user presses the `Enter` key while a suggestion is selected,
      * you can change some of the options that occur to the search bar,
      * default options are just blurring the search bar, other options include selecting the search bar text or
      * clearing the search bar input
      * @param { (searchItem: HTMLElement, extra: string, suggestion: string) => { input: "auto-complete" | "clear", searchBar: "select-input" | "blur" } } callback
      */
      enter: (callback) => events.addListener('enter', callback),
    };

    this.once = {
      /** emits when the prefix (and an argument) is fully matched,
      * should return a boolean that equals true to show the prefix's card or equals false to not show it, default is true
      * @param { (card: Card, searchItem: HTMLElement, extra: string, suggestion: string) => boolean } callback
      */
      activate: (callback) => events.once('activate', callback),
      /** emits when the user presses the `Enter` key while a suggestion is selected,
      * you can change some of the options that occur to the search bar,
      * default options are just blurring the search bar, other options include selecting the search bar text or
      * clearing the search bar input
      * @param { (searchItem: HTMLElement, extra: string, suggestion: string) => { input: "auto-complete" | "clear", searchBar: "select-input" | "blur" } } callback
      */
      enter: (callback) => events.once('enter', callback)
    };

    this.off = {
      /** emits when the prefix (and an argument) is fully matched,
      * should return a boolean that equals true to show the prefix's card or equals false to not show it, default is true
      * @param { (card: Card, searchItem: HTMLElement, extra: string, suggestion: string) => boolean } callback
      */
      activate: (callback) => events.removeListener('activate', callback),
      /** emits when the user presses the `Enter` key while a suggestion is selected,
      * you can change some of the options that occur to the search bar,
      * default options are just blurring the search bar, other options include selecting the search bar text or
      * clearing the search bar input
      * @param { (searchItem: HTMLElement, extra: extra, suggestion: string) => { input: "auto-complete" | "clear", searchBar: "select-input" | "blur" } } callback
      */
      enter: (callback) => events.removeListener('enter', callback)
    };

    this.emit = {
      /** @param { Card } card,
      * @param { HTMLElement } searchItem,
      * @param { string } extra
      * @param { string } suggestion
      */
      activate: (card, searchItem, extra, suggestion) => events.emit('activate', card, searchItem, extra, suggestion),
      /** @param { HTMLElement } searchItem,
      * @param { string } extra
      * @param { string } suggestion
      */
      enter: (searchItem, extra, suggestion) => events.emit('enter', searchItem, extra, suggestion)
    };

    /** @type { string[] }
    */
    let flexibleSuggestionsArray = [];

    /**
    * @param { string[] } suggestions
    */
    this.setSuggestions = (suggestions) =>
    {
      flexibleSuggestionsArray = [ ...suggestions ];
    };

    /**
    * @param { string[] } suggestions
    */
    this.addSuggestions = (...suggestions) =>
    {
      flexibleSuggestionsArray.push(...suggestions);
    };

    /**
    * @param { string } suggestion
    */
    this.removeSuggestion = (suggestion) =>
    {
      const index = flexibleSuggestionsArray.findIndex(suggestion);

      if (index > -1)
        return (flexibleSuggestionsArray.splice(index, 1))  ? true : false;
    };

    /**
    */
    this.getSuggestions = () => [ ...flexibleSuggestionsArray ];

    /** @type { string[] }
    */
    let fixedSuggestionsArray = [];

    /**
    * @param { string[] } suggestions
    */
    this.setFixedSuggestions = (suggestions) =>
    {
      fixedSuggestionsArray = [ ...suggestions ];
    };

    /**
    * @param { string[] } suggestions
    */
    this.addFixedSuggestions = (...suggestions) =>
    {
      fixedSuggestionsArray.push(...suggestions);
    };

    /**
    * @param { string } suggestion
    */
    this.removeFixedSuggestion = (suggestion) =>
    {
      const index = fixedSuggestionsArray.findIndex(suggestion);

      if (index > -1)
        return (fixedSuggestionsArray.splice(index, 1)) ? true : false;
    };

    /**
    */
    this.getFixedSuggestions = () => [ ...fixedSuggestionsArray ];

    /** remove all listeners
    * @param { 'activate' | 'enter' } [event]
    */
    this.removeAllListener = (event) => events.removeAllListeners(event);

    // set the readonly properties

    Object.defineProperty(this, 'prefix', {
      value: options.prefix,
      writable: false
    });

    // the prefix type wither its string or regexp
    Object.defineProperty(this, 'prefixType', {
      value: (typeof this.prefix === 'string') ? 'string' : 'regexp',
      writable: false
    });

    // if the prefix card is currently active,
    // the prefix is fully written in the search bar
    Object.defineProperty(this, 'active', {
      value: () => containsCard(this.card),
      writable: false
    });

    // stops the card from being appended or removed by the normal card api
    Object.defineProperty(this.card, 'ownedByPrefix', {
      value: true,
      writable: false
    });
  }

  register()
  {
    // prefix validation
    if (isRegisteredPrefix(this.prefix))
    {
      // if registered by a another object or by this object
      if (registeredPrefixes[this.prefix] !== this)
        return false;
      else
        return true;
    }
    
    // register the prefix and this object
    registeredPrefixes[this.prefix] = this;
      
    return true;
  }

  unregister()
  {
    // if active then remove the card element from dom
    if (this.active())
      document.body.removeChild(this.card.domElement);
    
    // delete the reference
    delete registeredPrefixes[this.prefix];

    // return a clone of the prefix card but without the api limitations
    return Object.assign(createCard(), this.card, { ownedByPrefix: undefined });
  }
}