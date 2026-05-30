const assert = require('node:assert/strict');
const { Given, When, Then, Before } = require('@cucumber/cucumber');
const interceptor = require('../../../src/interceptor.js');

Before(function () {
  const self = this;
  this.originalCalls = { create: 0, get: 0 };
  this.originalCredential = { id: 'original-credential' };
  this.decisions = { create: 'allow', get: 'allow' };
  this.bridgeConsulted = false;
  this.askedOperations = [];

  function originalImpl(name) {
    return function () {
      self.originalCalls[name] += 1;
      return Promise.resolve(self.originalCredential);
    };
  }
  this.credentials = { create: originalImpl('create'), get: originalImpl('get') };

  this.requestDecision = (operation) => {
    self.bridgeConsulted = true;
    self.askedOperations.push(operation);
    return Promise.resolve(self.decisions[operation]);
  };
});

function install(world) {
  interceptor.installInterceptor({
    credentials: world.credentials,
    requestDecision: (operation) => world.requestDecision(operation),
    timeoutMs: world.timeoutMs ?? 2000,
  });
}

async function callWithPublicKey(world, op) {
  install(world);
  try {
    world.result = await world.credentials[op]({ publicKey: { challenge: new Uint8Array([1]) } });
    world.error = null;
  } catch (e) {
    world.error = e;
  }
}

Given('a fake credentials container', function () {
  assert.equal(typeof this.credentials.create, 'function');
  assert.equal(typeof this.credentials.get, 'function');
});

Given('the bridge blocks {string}', function (op) {
  this.decisions[op] = 'block';
});

Given('the bridge allows everything', function () {
  this.decisions = { create: 'allow', get: 'allow' };
});

Given('the bridge never responds', function () {
  this.timeoutMs = 50;
  const self = this;
  this.requestDecision = (operation) => {
    self.bridgeConsulted = true;
    self.askedOperations.push(operation);
    return new Promise(() => {}); // never settles
  };
});

When('the interceptor is installed', function () {
  install(this);
});

When('the page calls {string} with a publicKey option', async function (op) {
  await callWithPublicKey(this, op);
});

When('the page calls {string} without a publicKey option', async function (op) {
  install(this);
  this.result = await this.credentials[op]({ password: { id: 'x', password: 'y' } });
  this.error = null;
});

Then('the call rejects with a {string}', function (name) {
  assert.ok(this.error, 'expected the call to reject');
  assert.equal(this.error.name, name);
});

Then('the original {string} is never called', function (op) {
  assert.equal(this.originalCalls[op], 0);
});

Then('the original {string} is called once', function (op) {
  assert.equal(this.originalCalls[op], 1);
});

Then('the call resolves with the original credential', function () {
  assert.equal(this.error, null);
  assert.equal(this.result, this.originalCredential);
});

Then('the bridge is never consulted', function () {
  assert.equal(this.bridgeConsulted, false);
});

Then('the bridge was asked about {string}', function (op) {
  assert.ok(this.askedOperations.includes(op), `bridge was asked about: ${this.askedOperations}`);
});

Then('{string} is named {string}', function (op, name) {
  assert.equal(this.credentials[op].name, name);
});
