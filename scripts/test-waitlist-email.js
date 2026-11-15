const assert = require('node:assert/strict');
const fs = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

async function loadWaitlistHelper() {
  const source = fs.readFileSync(path.join(__dirname, '../app/lib/waitlist.ts'), 'utf8');
  const module = new vm.SourceTextModule(stripTypeScriptTypes(source));
  await module.link(() => { throw new Error('Unexpected dependency'); });
  await module.evaluate();
  return module.namespace;
}

test('waitlist email draft preserves details and notification preference', async () => {
  const helper = await loadWaitlistHelper();

  for (const notification of [true, false]) {
    const link = helper.buildWaitlistEmail({
      name: 'Alice & Bob', email: 'alice+classes@example.com', phone: '(555) 123-4567',
      interest: 'both', experience: 'Nurse\nEMT', notification,
    });
    const [recipient, query] = link.split('?');
    const params = new URLSearchParams(query);
    assert.equal(recipient, 'mailto:info@anytimecprhealthservices.com');
    assert.equal(params.get('subject'), 'ACLS and PALS class inquiry');
    assert.equal(params.get('body'), [
      'Name: Alice & Bob', 'Email: alice+classes@example.com', 'Phone: (555) 123-4567',
      'Interest: both', 'Healthcare experience: Nurse\nEMT',
      `Requests email notifications: ${notification ? 'Yes' : 'No'}`,
    ].join('\n'));
  }
});

test('waitlist form uses the email draft and explains the handoff', () => {
  const source = fs.readFileSync(path.join(__dirname, '../app/waitlist/page.tsx'), 'utf8');
  assert.match(source, /onSubmit=\{handleSubmit\}/);
  assert.match(source, /window\.location\.href = buildWaitlistEmail\(formData\)/);
  assert.match(source, /review and send it in your email app/);
  assert.match(source, /href="\/contact"/);
  assert.doesNotMatch(source, /Thank you for joining our waitlist/);
});
