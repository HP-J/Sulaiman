// TODO access to register for oninput event
// TODO access to change placeholder (every button when selected can change placeholder value) (what about auto-complete)
// TODO access to allocate block from page (how to clean a block childs)

import { NodeVM } from 'vm2';

// /** @param { (inputValue: string) => void } callback
// */
// export function oninput(callback)
// {

// }

export function init()
{
  const vm = new NodeVM(
    {
      require:
      {
        external: [  './extTest.js' ],
        context: 'sandbox'
      }
    });
  
  vm.run('require("./extTest.js");', __filename);
}

/** @param { {displayName: string} } options
* @returns 
*/
export function register(options)
{
  console.log('registered options');
  
  return false;
}

// /** @param { string } extensionName
//  * @returns { HTMLDivElement } do what ever you what with it
// */
// export function allocate()
// {

// }