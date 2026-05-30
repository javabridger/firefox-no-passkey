'use strict';

const path = require('path');
const http = require('http');
const fs = require('fs');
const { execSync } = require('child_process');
const { Builder } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const { BeforeAll, AfterAll, Before, After, setDefaultTimeout } = require('@cucumber/cucumber');

setDefaultTimeout(120000);

const ROOT = path.resolve(__dirname, '../../..');
let server;
let baseUrl;
let extensionPath;

BeforeAll(function () {
  // Package the extension once, then install that zip as a temporary add-on per scenario.
  execSync('npm run build', { cwd: ROOT, stdio: 'ignore' });
  const artifactsDir = path.join(ROOT, 'web-ext-artifacts');
  const zips = fs
    .readdirSync(artifactsDir)
    .filter((f) => f.endsWith('.zip'))
    .map((f) => path.join(artifactsDir, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (!zips.length) throw new Error('web-ext build produced no zip in ' + artifactsDir);
  extensionPath = zips[0];

  // Serve the fixture over http://localhost, which is a WebAuthn secure context.
  const fixture = fs.readFileSync(path.join(__dirname, '../fixtures/passkey-page.html'));
  server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fixture);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      baseUrl = `http://localhost:${server.address().port}/`;
      resolve();
    });
  });
});

AfterAll(function () {
  return new Promise((resolve) => (server ? server.close(resolve) : resolve()));
});

Before(async function () {
  const options = new firefox.Options().addArguments('-headless');
  // Route WebAuthn to Firefox's internal software token so any passthrough create()/get()
  // resolves in-process and NEVER triggers the real OS (Windows Hello / platform) dialog.
  options.setPreference('security.webauth.webauthn_enable_softtoken', true);
  options.setPreference('security.webauth.webauthn_enable_usbtoken', false);
  const bin = process.env.FIREFOX_BIN || 'C:\\Program Files\\Mozilla Firefox\\firefox.exe';
  if (fs.existsSync(bin)) options.setBinary(bin);

  this.driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build();
  await this.driver.installAddon(extensionPath, true);
  this.baseUrl = baseUrl;
});

After(async function () {
  if (this.driver) {
    await this.driver.quit();
    this.driver = null;
  }
});
