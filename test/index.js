
import { Application } from 'spectron';

import * as Electron from 'electron';

import assert from 'assert';

import { join } from 'path';

// function sleep(ms)
// {
//   return new Promise((resolve) => { return setTimeout(resolve, ms); });
// }

describe('Application launch', function()
{
  this.timeout(100000);

  /** @type { Application }
  */
  let app = undefined;

  beforeEach(async() =>
  {
    app = new Application(
      {
        path: join(__dirname, '../node_modules/.bin/electron'),
        args: [ join(__dirname, '../public/main/main.js') ]
      });

    await app.start();
  });

  afterEach(async() =>
  {
    if (app && app.isRunning())
      await app.stop();
  });

  it('test no. 1', () =>
  {
    assert.strictEqual(app.isRunning(), true);
  });
});