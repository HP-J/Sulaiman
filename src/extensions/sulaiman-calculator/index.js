import { on, setInput } from 'sulaiman';

import { Parser } from 'expr-eval';

const parser = new Parser();

/** @param { string } string
*/
function parse(string)
{
  return parser.parse(string).evaluate({ pi: Math.PI, Pi: Math.PI, PI: Math.PI });
}

function registerPhrase()
{
  on.ready(() =>
  {
    let result;

    on.phrase(
      /^(\(|(abs|acos|acosh|asin|asinh|atan|atanh|ceil|cos|cosh|exp|floor|length|ln|log|log10|round|sin|sinh|sqrt|tan|tanh|trunc|random)|(-|\+)?[0-9])(.*)/i,
      undefined,
      {
        activate: (card, suggestion, match) =>
        {
          try
          {
            result = parse(match);
          }
          catch (err)
          {
            result = 'Syntax ERROR';
          }

          if (typeof result !== 'number' && typeof result !== 'boolean')
            result = 'Syntax ERROR';
  
          suggestion.appendChild(document.createElement('div')).innerText = ' = ' + result;
  
          return false;
        },
        enter: () =>
        {
          setInput(result);
          
          return { searchBar: 'select-input' };
        }
      });
  });
}

registerPhrase();