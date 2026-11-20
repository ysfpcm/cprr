const assert = require('node:assert/strict');
const fs = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

async function loadContactRoute(logs) {
  const context = vm.createContext({
    console: {
      log: (...args) => logs.push(args.join(' ')),
      error: (...args) => logs.push(args.join(' ')),
    },
  });
  const next = new vm.SyntheticModule(['NextResponse'], function () {
    this.setExport('NextResponse', { json: (body, init) => Response.json(body, init) });
  }, { context });
  const source = fs.readFileSync(path.join(__dirname, '../app/api/contact/route.ts'), 'utf8');
  const route = new vm.SourceTextModule(stripTypeScriptTypes(source), { context });
  await route.link(() => next);
  await route.evaluate();
  return route.namespace;
}

function contactRequest(body) {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('contact submissions report unavailable delivery and provide a direct email', async () => {
  const logs = [];
  const route = await loadContactRoute(logs);
  const response = await route.POST(contactRequest({
    name: 'Alice', email: 'alice@example.com', phone: '555-123-4567', message: 'Private inquiry',
  }));
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.match(body.error, /info@anytimecprhealthservices\.com/);
  assert.match(body.error, /your message has not been sent/i);
  assert.doesNotMatch(logs.join('\n'), /Alice|alice@example\.com|555-123-4567|Private inquiry/);
});

test('contact submissions still reject missing required fields', async () => {
  const route = await loadContactRoute([]);
  const response = await route.POST(contactRequest({ email: 'alice@example.com' }));

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Name, email, and message are required/);
});
