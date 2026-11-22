const assert = require('node:assert/strict');
const fs = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

async function loadRoute(matrixResponse) {
  const methods = [];
  const context = vm.createContext({
    process: { env: { SIMPLYBOOK_API_KEY: 'test-key', SIMPLYBOOK_COMPANY_LOGIN: 'test-company' } },
    console: { log() {}, error() {} },
    URL,
    fetch: async (_url, options) => {
      const request = JSON.parse(options.body);
      methods.push(request.method);
      if (request.method === 'getStartTimeMatrix') return matrixResponse();
      const results = {
        getToken: 'test-token',
        getEventList: {},
        getUnitList: { 3: { name: 'Instructor' } },
        getEvent: { unit_map: [3] },
        getWorkCalendar: {},
      };
      if (!(request.method in results)) throw new Error(`Unexpected method: ${request.method}`);
      return Response.json({ result: results[request.method] });
    },
  });
  const next = new vm.SyntheticModule(['NextResponse'], function () {
    this.setExport('NextResponse', { json: (body, options) => Response.json(body, options) });
  }, { context });
  const source = fs.readFileSync(path.join(__dirname, '../app/api/simplybook-time-slots/route.ts'), 'utf8');
  const route = new vm.SourceTextModule(stripTypeScriptTypes(source), { context });
  await route.link(() => next);
  await route.evaluate();
  return { get: () => route.namespace.GET(new Request('http://localhost/api/simplybook-time-slots?eventId=2&date=2026-11-20')), methods };
}

test('time slots preserve successful availability, including an empty schedule', async (t) => {
  for (const slots of [['14:00:00'], []]) {
    await t.test(`${slots.length} available slots`, async () => {
      const route = await loadRoute(() => Response.json({ result: { '2026-11-20': slots } }));
      const response = await route.get();
      assert.equal(response.status, 200);
      assert.deepEqual((await response.json()).availableTimeSlots, slots);
      assert.ok(route.methods.includes('getWorkCalendar'));
    });
  }
});

test('time slots report upstream failures instead of an empty schedule', async (t) => {
  const failures = [
    ['JSON-RPC error', () => Response.json({ error: { message: 'Unavailable' } })],
    ['HTTP error with result', () => Response.json({ result: { '2026-11-20': [] } }, { status: 503 })],
    ['HTTP error with non-JSON body', () => new Response('Unavailable', { status: 503 })],
  ];
  for (const [name, responseFactory] of failures) {
    await t.test(name, async () => {
      const route = await loadRoute(responseFactory);
      const response = await route.get();
      assert.equal(response.status, 502);
      assert.match((await response.json()).error, /failed to check time slots/i);
      assert.ok(!route.methods.includes('getWorkCalendar'));
    });
  }
});
