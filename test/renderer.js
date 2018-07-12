import assert from 'assert';

import { join } from 'path';

import { existsSync } from 'fs';

import { exec, ChildProcess } from 'child_process';

import { connect, Browser, Page } from 'puppeteer';

import rp from 'request-promise';

import pti from 'puppeteer-to-istanbul';

import pidtree from 'pidtree';

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

  /** @type { ChildProcess }
  */
  let electron;

  if (!existsSync(join(__dirname, '../public')))
    throw 'public directory does not exists';

  async function getDebuggerUrl()
  {
    const respond = await rp('http://localhost:9225/json/version', { json: true });

    return respond.webSocketDebuggerUrl;
  }

  before(async() =>
  {
    electron = exec('./node_modules/.bin/electron ./public/main/main.js --remote-debugging-port=9225');

    let browserWSEndpoint;
    const sleepTimeout = 1500;
    const retry = 15;

    for (let i = 0; i < retry; i++)
    {
      try
      {
        browserWSEndpoint = await getDebuggerUrl();
      }
      catch (e)
      {
        await sleep(sleepTimeout);
      }
      finally
      {
        if (browserWSEndpoint)
          break;
        else if (i === retry - 1)
          throw 'Error Connecting to Chrome DevTools Protocol';
      }
    }

    browser = await connect({ browserWSEndpoint: browserWSEndpoint });

    page = (await browser.pages())[0];

    browser.emit('close');

    await page.coverage.startJSCoverage();

    await page.reload();

    await sleep(2500);

    const jsCoverage = await page.coverage.stopJSCoverage();
    
    pti.write(jsCoverage);
  });

  after(async() =>
  {
    const list = await pidtree(electron.pid);

    for (let i = 0; i < list.length; i++)
    {
      process.kill(list[i]);
    }
  });

  it('is Application Running', () =>
  {
    // assert.strictEqual(app.isRunning(), true);
  });
});