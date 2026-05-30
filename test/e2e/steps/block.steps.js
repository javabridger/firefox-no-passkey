'use strict';

const assert = require('node:assert/strict');
const { Given, When, Then } = require('@cucumber/cucumber');
const { By, until } = require('selenium-webdriver');

const TOAST = By.css('[data-nopasskey-toast]');
const BUTTONS = { 'Create passkey': 'create', 'Login with passkey': 'login' };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function toastCount(driver) {
  return (await driver.findElements(TOAST)).length;
}

Given('a fresh Firefox with NoPasskey installed', function () {
  // The Before hook builds + installs the add-on into a fresh profile.
  assert.ok(this.driver, 'driver should be initialised');
});

When('I open the passkey test page', async function () {
  await this.driver.get(this.baseUrl);
  await this.driver.wait(until.elementLocated(By.id('create')), 10000);
});

When('I click {string}', async function (label) {
  const id = BUTTONS[label];
  assert.ok(id, `unknown button: ${label}`);
  await this.driver.wait(until.elementLocated(By.id(id)), 10000);
  await this.driver.findElement(By.id(id)).click();
});

When('I click "Allow this site" in the notification', async function () {
  await this.driver.wait(until.elementLocated(TOAST), 10000);
  // Toast lives in an open shadow root; reach the button through it, then the page reloads.
  await this.driver.executeScript(
    "document.querySelector('[data-nopasskey-toast]').shadowRoot.querySelector('.allow').click();"
  );
  await this.driver.wait(until.elementLocated(By.id('create')), 10000);
});

Then('the create call is rejected as {string}', async function (name) {
  await this.driver.wait(async () => {
    const text = await this.driver.findElement(By.id('createResult')).getText();
    return text === `create: rejected:${name}`;
  }, 10000, `create was not rejected as ${name}`);
});

Then('a NoPasskey block notification appears', async function () {
  await this.driver.wait(until.elementLocated(TOAST), 10000);
});

Then('no NoPasskey block notification appears', async function () {
  // Give any block path time to fire, then assert the toast never showed up.
  await sleep(3000);
  assert.equal(await toastCount(this.driver), 0, 'a block notification appeared but should not have');
});
