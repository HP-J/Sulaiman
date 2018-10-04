import * as sulaiman from 'sulaiman';

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
  sulaiman.on.ready(() =>
  {
    let result;

    sulaiman.on.phrase(
      /^(\(|abs|(-|\+)?[0-9])(.*)/i,
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
  
          suggestion.appendChild(document.createTextNode(' = ' + result));
  
          return false;
        },
        enter: () =>
        {
          sulaiman.setInput(result);
          
          return { selectSearchBarText: true };
        }
      });
  });
}

registerPhrase();