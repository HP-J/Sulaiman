// TODO access to register for oninput event
// TODO access to change placeholder (every button when selected can change placeholder value) (what about auto-complete)
// TODO access to allocate block from page (how to clean a block childs)

import { NodeVM } from 'vm2';

const extVMs = {};

const extEvents = {};

/** when sulaiman (re)load the user will get a registry request
* that will show him all the permissions you're asking for, if they
* chosen to accept the request, your extension gets the permissions and modules you asked for,
* then events will register their attached callbacks if any, then the callback function gets executed

* @param { string } name the name of the extension

* @param { [ 'fs.read', 'fs.write', 'window.body' ] } permissions
* some modules like `fs` are divided to multiple subsets of functions,
* in those cases, the module will be ignored if it was added in `require` and can only be
* required in `permissions`.
* example: `[ 'fs.read' ]` will give you access to the read functions only of the `fs` module,
* you can also ask for permissions to use some global variables
* example: `[ 'window.body' ]` you can find all the available permissions and what they do in our wiki

* @param { [ '...' ] } modules here you can ask for permissions to use a full module, example: `[ 'electron', 'request' ]`
* @param { { 'oninput': Function } } events a set of events that you can attach callback to,
* you can find all the available events and when they are executed in our wiki

* @param { () => {} } callback gets executed when the user accepts the registry object request
*/
export function register(name, permissions, modules, events, callback)
{
  // ask the user for the permissions using async (don't hang the application)

  extVMs[name] = new NodeVM(
    {
      require:
      {
        // accepted registry request node builtin modules
        builtin: [],
        // accepted registry request modules
        external: [],
        // host allows any required module to require more modules inside it with no limits
        context: `host`
      }
    });

  // call from the new NodeVM
  callback();
}