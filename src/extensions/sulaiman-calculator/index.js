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
      /(((abs|acos|acosh|asin|asinh|atan|atanh|ceil|cos|cosh|exp|floor|length|ln|log|log10|not|round|sin|sinh|sqrt|tan|tanh|trunc|random)\((?:\s)?)?((?:\()+(?:\s)?)?((\+|-)?[0-9]+|pi)((?:\s)?(?:\))+)?((?:\s)?(\+|-|\*|\/|%|\^|==|!=|>=|<=|>|<)(?:\s)?((abs|acos|acosh|asin|asinh|atan|atanh|ceil|cos|cosh|exp|floor|length|ln|log|log10|not|round|sin|sinh|sqrt|tan|tanh|trunc|random)\((?:\s)?)?(?:\(?)+(?:\s)?((\+|-)?[0-9]+|pi)((?:\s)?(?:\))+)?)+)|((abs|acos|acosh|asin|asinh|atan|atanh|ceil|cos|cosh|exp|floor|length|ln|log|log10|not|round|sin|sinh|sqrt|tan|tanh|trunc|random)\((?:\s)?[0-9](?:\s)?\))/i,
      undefined,
      // on activation
      (phrase, match) =>
      {
        try
        {
          result = parse(match);
        }
        catch (err)
        {
          result = 'Syntax ERROR';
        }

        phrase.suggestion.appendChild(sulaiman.createTextNode(' = ' + result));

        return false;
      },
      // on enter
      () =>
      {
        sulaiman.setInput(result);
        
        return { selectSearchBarText: true };
      });
  });
}

registerPhrase();