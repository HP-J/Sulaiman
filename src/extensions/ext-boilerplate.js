import { register } from '.';

register(`ext-boilerplate`,
  [ ],
  [ ],
  { oninput: oninput },
  () =>
  {
    // TODO make sure the callback is executed in a sandbox
  
    console.log(`register completed, we have been called back`);
  });

function oninput(text)
{
  console.log(`oninput extension callback: ${text}`);
}