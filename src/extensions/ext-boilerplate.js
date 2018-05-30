const localConst = 4; 

function callback()
{
  console.log(`register completed, we have been called back`);
}

function oninput(text)
{
  console.log(`oninput extension ${localConst}'s callback: ${text}`);
}