export default class Events
{
  constructor()
  {
    /**
     * @type { Object<string, { listener: (...args: any[]) => any , once: boolean }[] }
     */
    this._events = {};
  }


  /** add a listener that will be emitted unlimited times
  * @param { string } event
  * @param { (...args: any[]) => any } listener
  */
  addListener(event, listener)
  {
    if (!this._events[event])
      this._events[event] = [];
    
    this._events[event].push({
      listener: listener
    });
  }

  /** add a listener that will only be emitted once
  * @param { string } event
  * @param { (...args: any[]) => any } listener
  */
  once(event, listener)
  {
    if (!this._events[event])
      this._events[event] = [];
  
    this._events[event].push({
      listener: listener,
      once: true
    });
  }

  /** remove one listener from a specific event
  * @param { string } event
  * @param { (...args: any[]) => any } listener
  */
  removerListener(event, listener)
  {
    if (!this._events[event])
      return;
    
    this._events[event] = this._events[event].filter((value) => value.listener !== listener);
  }

  /** remove all the listeners from a specific event or
  * remove all the listeners from all the events
  * @param { string } [event]
  */
  removerAllListener(event)
  {
    // remove all the listeners from all the events
    if (!event)
    {
      this._events = {};
    }
    // remove all the listeners from a specific event
    else
    {
      if (!this._events[event])
        return;

      this._events[event] = undefined;
    }
  }

  /** emit all the listeners from a specific event
  * returns the value of the last listener
  * @param { string } event
  * @param { any[] } args
  */
  emit(event, ...args)
  {
    if (!this._events[event])
      return;
    
    let callbackValue;

    this._events[event].forEach((value) =>
    {
      callbackValue = value.listener.call(undefined, ...args);
    });

    return callbackValue;
  }
}