import assert from 'assert';

import { join } from 'path';

import { existsSync } from 'fs';

import * as cmd from 'node-cmd';

import { promisify } from 'util';

import { connect, Browser, Page } from 'puppeteer';

import rp from 'request-promise';

import pti from 'puppeteer-to-istanbul';

const getAsync = promisify(cmd.get, { multiArgs: true, context: cmd });

function sleep(ms)
{
  return new Promise((resolve) =>
  {
    return setTimeout(resolve, ms);
  });
}

describe('Application launch', function()
{
  this.timeout(50000);

  /** @type { Browser }
  */
  let browser;

  /** @type { Page }
  */
  let page;

  before(async() =>
  {
    if (existsSync(join(__dirname, '../public')))
      await getAsync('rm -r ./public/');

    await getAsync('npx babel src --out-dir public --ignore node_modules --source-maps --copy-files');

    cmd.run('./node_modules/.bin/electron ./public/main/main.js --remote-debugging-port=9222');

    await sleep(2500);

    const respond = await rp('http://localhost:9222/json/version', { json: true });

    console.log(respond.webSocketDebuggerUrl);

    // browser = await connect({ browserWSEndpoint: respond.webSocketDebuggerUrl });

    // const pages = await browser.pages();

    // page = pages[0];

    // await page.coverage.startJSCoverage();

    // await page.reload();

    // await sleep(2500);

    // const jsCoverage = await page.coverage.stopJSCoverage();
    
    // pti.write(jsCoverage);

    // await page.screenshot({ path: 'example.png' });
  });

  it('is Application Running', () =>
  {
    // assert.strictEqual(app.isRunning(), true);
  });
});