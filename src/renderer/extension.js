// TODO access to register for oninput event
// TODO access to change placeholder (every button when selected can change placeholder value) (what about auto-complete)
// TODO access to allocate block from page (how to clean a block childs)

// const extensions = {};

/** @param { Object } registryObject
* it contains all the permissions and configuration of the extension,
* when sulaiman (re)load the user will get a registry object request
* that will show him all the permissions you're asking for, if they
* chosen to accept the request, your extension gets the permissions you asked for,
* then events will register their attached callbacks if any, then the callback function gets executed
* @param { string } registryObject.name the name of the extension
* @param { string[] } registryObject.permissions
* some modules like 'fs' are divided to multiple subsets of functions,
* in those cases, the module will be ignored if it was added in `require: []` and can only be
* required in `permissions: []`.
* example: [ 'fs.read' ] will give you access to the read functions only of the 'fs' module,
* you can also ask for permissions to use some global variables
* example: [ window.body ]
* @param { string[] } registryObject.require here you can ask for permissions to use a full module, example: [ 'electron', 'request' ]
* @param { { "oninput": Function } } events a set of events that you can attach callback to
* @param { () => {} } callback gets executed when the user accepts the registry object request
*/
export function register(registryObject, events, callback)
{
  // ask the user for the permissions
  // extensions[registryObject.name] = registryObject;

  callback();
}