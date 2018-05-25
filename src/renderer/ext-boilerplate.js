// TODO move registry objects to json files

import { register } from './extension.js';

// /** this object is called registry object,
// * it contains all the permissions and configuration of the extension,
// * when sulaiman first starts the user will get a registry object request
// * that will show him all the permissions the extension wants, if they
// * chosen to agree, then the entry function is called and the callbacks 
// * will be registered to their events.
// */
// export default {
//   /** the extension name */
//   name: 'ext-test',
//   /** the function that gets called when the user accepts the registry object request */
//   entry: init,
//   /** there is a set of events that you can register callback to */
//   events: {
//     oninput: inputCallback
//   },
//   permissions: [
//     /** some modules like 'fs' are divided to multiple subsets of functions,
//     * in those cases, the module will be ignored if it was added in `require: []` and can only be
//     * required in `permissions: []`.
//     * example: 'fs.read' will give you access to the read functions of the 'fs' module
//     * while 'fs.write' gives you access to all the write, rename and remove functions,
//     * 'fs' will give you access to all the subsets combined.
//     * the module can be `require('fs')` normally but if you dont have a permission for a subset
//     * all the subset's functions will be undefined
//     */
//     'fs.read',
//     'fs.write',

//     /** you can also ask for permissions to use some global variables,
//     * and some sulaiman api, the permissions can be found in the extension wiki page
//     */
//     'window.body'
//   ],
//   /** here you can ask for permissions to use a full module,
//   * any type of module external, builtin or local.
//   * if a module is not set in the array and was called in a `require()` it will throw an error,
//   * and you can only load local modules from inside the extension directory  
//   */
//   require: [
//     'path',
//     'request',
//     './secondPart.js'
//   ]
// };

// const test = 'init init init';

// /** gets triggered once, when the user accepts the registry object request
// * specified in the `entry` from the registry object
// */
// function init()
// {
//   console.log(test);
// }

// function inputCallback()
// {

// }

register('oy');