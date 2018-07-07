import { Application } from 'spectron';

import assert from 'assert';

import { join } from 'path';

import { existsSync } from 'fs';

import * as cmd from 'node-cmd';

import { promisify } from 'util';

const getAsync = promisify(cmd.get, { multiArgs: true, context: cmd });

function sleep(ms)
{
  return new Promise((resolve) => { return setTimeout(resolve, ms); });
}

describe('Application launch', function()
{
  this.timeout(50000);

  /** @type { Application }
  */
  let app = undefined;

  before(async() =>
  {
    if (existsSync(join(__dirname, '../public')))
      await getAsync('rm -r ./public/');

    await getAsync('npx babel src --out-dir public --ignore node_modules --source-maps --copy-files');

    app = new Application(
      {
        path: join(__dirname, '../node_modules/.bin/electron'),
        args: [ join(__dirname, '../public/main/main.js') ]
      });

    await app.start();

    await sleep(2000);
  });

  after(async() =>
  {
    if (app && app.isRunning())
      await app.stop();
  });

  it('is Application Running', () =>
  {
    assert.strictEqual(app.isRunning(), true);
  });
});