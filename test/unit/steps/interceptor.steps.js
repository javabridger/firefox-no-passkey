const assert = require('node:assert/strict');
const { Given, When, Then, Before } = require('@cucumber/cucumber');
const interceptor = require('../../../src/interceptor.js');

Before(function () {
  this.originalCalls = 0;
  this.originalCredential = { id: 'original-credential' };

  // A fake CredentialsContainer that records how often create/get are invoked.
  const self = this;
  this.credentials = {
    create() {
      self.originalCalls += 1;
      return Promise.resolve(self.originalCredential);
    },
    get() {
      return Promise.resolve({ id: 'login-assertion' });
    },
  };
  this.originalGet = this.credentials.get;

  // requestDecision is whatever the scenario configures; default consulted=false.
  this.bridgeConsulted = false;
  this.requestDecision = () => {
    self.bridgeConsulted = true;
    return Promise.resolve('allow');
  };
});

function install(world) {
  interceptor.installCreateInterceptor({
    credentials: world.credentials,
    requestDecision: () => world.requestDecision(),
    timeoutMs: world.timeoutMs ?? 2000,
  });
}

Given('a fake credentials container', function () {
  // Built in the Before hook; this step documents the precondition.
  assert.equal(typeof this.credentials.create, 'function');
});

Given('the bridge decides to {string}', function (decision) {
  const self = this;
  this.requestDecision = () => {
    self.bridgeConsulted = true;
    return Promise.resolve(decision);
  };
});

Given('the bridge never responds', function () {
  this.timeoutMs = 50;
  const self = this;
  this.requestDecision = () => {
    self.bridgeConsulted = true;
    return new Promise(() => {}); // never settles
  };
});

When('the interceptor is installed', function () {
  install(this);
});

When('the page calls create with a publicKey option', async function () {
  install(this);
  try {
    this.result = await this.credentials.create({ publicKey: { challenge: new Uint8Array([1]) } });
    this.error = null;
  } catch (e) {
    this.error = e;
  }
});

When('the page calls create without a publicKey option', async function () {
  install(this);
  this.result = await this.credentials.create({ password: { id: 'x', password: 'y' } });
  this.error = null;
});

Then('create rejects with a {string}', function (name) {
  assert.ok(this.error, 'expected create() to reject');
  assert.equal(this.error.name, name);
});

Then('the original create is never called', function () {
  assert.equal(this.originalCalls, 0);
});

Then('the original create is called once', function () {
  assert.equal(this.originalCalls, 1);
});

Then('create resolves with the original credential', function () {
  assert.equal(this.error, null);
  assert.equal(this.result, this.originalCredential);
});

Then('the bridge is never consulted', function () {
  assert.equal(this.bridgeConsulted, false);
});

Then('credentials.get is the original function', function () {
  assert.equal(this.credentials.get, this.originalGet);
});

Then('credentials.create is named {string}', function (name) {
  assert.equal(this.credentials.create.name, name);
});
