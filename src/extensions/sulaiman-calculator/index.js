import { createPrefix, setInput } from 'sulaiman';

import { Parser } from 'expr-eval';

const parser = new Parser();

/** @param { string } string
*/
function parse(string)
{
  return parser.parse(string.toLowerCase()).evaluate({ pi: Math.PI });
}

function init()
{
  let result;

  const prefix = createPrefix({
    prefix: /^(\(|(abs|acos|acosh|asin|asinh|atan|atanh|ceil|cos|cosh|exp|floor|length|ln|log|log10|round|sin|sinh|sqrt|tan|tanh|trunc|random)|(-|\+)?[0-9])(.*)/i
  });

  prefix.on.enter(() =>
  {
    setInput(result);
        
    return { searchBar: 'select-input' };
  });
  
  prefix.on.activate((card, searchItem, extra) =>
  {
    try
    {
      result = parse(extra);
    }
    catch (err)
    {
      result = 'Syntax ERROR';
    }

    if (typeof result !== 'number' && typeof result !== 'boolean')
      result = 'Syntax ERROR';

    searchItem.innerText = ' = ' + result;

    return false;
  });

  prefix.register();
}

init();