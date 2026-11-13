const assert = require('node:assert/strict');
const fs = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadModule(file, context) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  return new vm.SourceTextModule(stripTypeScriptTypes(source), { context, identifier: file });
}

async function createRoutes(bookingResult = async () => Response.json({ success: true })) {
  let checkoutSession;
  let booking;
  const context = vm.createContext({
    process: { env: {
      NODE_ENV: 'production',
      STRIPE_SECRET_KEY: 'test-key',
      STRIPE_WEBHOOK_SECRET: 'test-secret',
      NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
    } },
    console: { log() {}, warn() {}, error() {} },
    URL,
    fetch: async (_url, options) => {
      booking = JSON.parse(options.body);
      return bookingResult(booking);
    },
  });
  class Stripe {
    checkout = { sessions: { create: async (data) => {
      checkoutSession = data;
      return { id: 'cs_test', url: 'http://localhost/checkout' };
    } } };
    webhooks = { constructEvent: (body) => JSON.parse(body) };
  }
  const services = loadModule('app/lib/services.ts', context);
  const next = new vm.SyntheticModule(['NextResponse'], function () {
    this.setExport('NextResponse', { json: (body, options) => Response.json(body, options) });
  }, { context });
  const stripe = new vm.SyntheticModule(['default'], function () {
    this.setExport('default', Stripe);
  }, { context });
  const dependencies = {
    'next/server': next,
    stripe,
    '../../../lib/services': services,
  };
  const checkout = loadModule('app/api/stripe/checkout/route.ts', context);
  const webhook = loadModule('app/api/stripe/webhook/route.ts', context);
  const linker = (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  };
  await checkout.link(linker);
  await checkout.evaluate();
  await webhook.link(linker);
  await webhook.evaluate();
  return { checkout: checkout.namespace, webhook: webhook.namespace, services: services.namespace,
    getCheckout: () => checkoutSession, getBooking: () => booking };
}

async function deliverWebhook(routes, session) {
  const response = await postWebhook(routes, session);
  assert.equal(response.status, 200);
  return routes.getBooking();
}

async function postWebhook(routes, session) {
  return routes.webhook.POST(new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'test-signature' },
    body: JSON.stringify({ type: 'checkout.session.completed', data: { object: session } }),
  }));
}

test('checkout phone reaches the webhook booking without Stripe phone collection', async () => {
  const routes = await createRoutes();
  const phone = '(713) 555-0123';
  const response = await routes.checkout.POST(new Request('http://localhost/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({
      service: routes.services.services[0].name,
      participants: '1',
      date: 'November 20, 2026',
      time: '2:00 PM',
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      phone,
    }),
  }));
  assert.equal(response.status, 200);
  const checkout = routes.getCheckout();
  const booking = await deliverWebhook(routes, {
    id: 'cs_test',
    customer_email: checkout.customer_email,
    customer_details: { phone: null },
    metadata: checkout.metadata,
  });
  assert.equal(booking.phone, phone);
});

test('checkout preserves the selected instructor for the webhook booking', async () => {
  const routes = await createRoutes();
  const response = await routes.checkout.POST(new Request('http://localhost/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({
      service: routes.services.services[0].name,
      participants: '1',
      date: 'November 20, 2026',
      time: '2:00 PM',
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      unitId: 3,
    }),
  }));
  assert.equal(response.status, 200);
  const checkout = routes.getCheckout();
  assert.equal(checkout.metadata.unitId, '3');
  const booking = await deliverWebhook(routes, {
    id: 'cs_instructor',
    customer_email: checkout.customer_email,
    metadata: checkout.metadata,
  });
  assert.equal(booking.unitId, 3);
});

test('webhook booking sends the selected instructor to SimplyBook', async () => {
  let bookRequest;
  const context = vm.createContext({
    process: { env: { SIMPLYBOOK_API_KEY: 'test-key', SIMPLYBOOK_COMPANY_LOGIN: 'test-company' } },
    console: { log() {}, warn() {}, error() {} },
    fetch: async (_url, options) => {
      const request = JSON.parse(options.body);
      const results = {
        getToken: 'test-token',
        getUnitList: { 2: { name: 'Other instructor' }, 3: { name: 'Selected instructor' } },
        getEvent: { unit_map: [2, 3] },
        getStartTimeMatrix: { '2026-11-20': ['14:00:00'] },
        book: { id: 'booking-1' },
      };
      if (!(request.method in results)) throw new Error(`Unexpected method: ${request.method}`);
      if (request.method === 'book') bookRequest = request;
      return Response.json({ result: results[request.method] });
    },
  });
  context.global = context;
  const bookings = loadModule('app/api/bookings/route.ts', context);
  const dependencies = {
    'next/server': new vm.SyntheticModule(['NextResponse'], function () {
      this.setExport('NextResponse', { json: (body, options) => Response.json(body, options) });
    }, { context }),
    '../../lib/bookings': new vm.SyntheticModule(['Booking', 'getInitialBookings'], function () {
      this.setExport('Booking', undefined);
      this.setExport('getInitialBookings', () => []);
    }, { context }),
    '../../lib/services': loadModule('app/lib/services.ts', context),
    'date-fns': new vm.SyntheticModule(['format', 'parseISO', 'parse'], function () {
      for (const name of ['format', 'parseISO', 'parse']) {
        this.setExport(name, () => { throw new Error(`Unexpected date-fns call: ${name}`); });
      }
    }, { context }),
  };
  await bookings.link((name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  });
  await bookings.evaluate();
  const routes = await createRoutes((booking) => bookings.namespace.POST(new Request('http://localhost/api/bookings', {
    method: 'POST',
    body: JSON.stringify(booking),
  })));
  const checkoutResponse = await routes.checkout.POST(new Request('http://localhost/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({
      service: routes.services.services[0].name,
      participants: 1,
      date: '2026-11-20',
      time: '2:00 PM',
      customerEmail: 'customer@example.com',
      unitId: 3,
    }),
  }));
  assert.equal(checkoutResponse.status, 200);
  const checkout = routes.getCheckout();
  await deliverWebhook(routes, {
    id: 'cs_instructor',
    customer_email: checkout.customer_email,
    metadata: checkout.metadata,
  });
  assert.equal(bookRequest.params[1], 3);
});

test('webhook ignores missing or invalid instructor IDs in older sessions', async () => {
  const routes = await createRoutes();
  for (const metadata of [{}, { unitId: '3invalid' }, { unitId: '0' }, { unitId: '9007199254740992' }]) {
    const booking = await deliverWebhook(routes, {
      id: 'cs_old',
      customer_email: 'customer@example.com',
      metadata,
    });
    assert.equal(booking.unitId, undefined);
  }
});

test('checkout rejects invalid instructor IDs', async () => {
  const routes = await createRoutes();
  for (const unitId of [0, -1, 1.5, '3invalid', '9007199254740992']) {
    const response = await routes.checkout.POST(new Request('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ service: routes.services.services[0].name, participants: 1, unitId }),
    }));
    assert.equal(response.status, 400);
  }
});

test('webhook retains Stripe phone fallback for older sessions', async () => {
  const routes = await createRoutes();
  const booking = await deliverWebhook(routes, {
    id: 'cs_old',
    customer_email: 'customer@example.com',
    customer_details: { phone: '+17135550123' },
    metadata: {},
  });
  assert.equal(booking.phone, '+17135550123');
});

test('webhook prefers the booking phone and tolerates missing phone details', async () => {
  const routes = await createRoutes();
  const booking = await deliverWebhook(routes, {
    id: 'cs_test',
    customer_email: 'customer@example.com',
    customer_details: { phone: '+17135550123' },
    metadata: { customerPhone: '(713) 555-0456' },
  });
  assert.equal(booking.phone, '(713) 555-0456');

  const missingPhoneBooking = await deliverWebhook(routes, {
    id: 'cs_old',
    customer_email: 'customer@example.com',
    metadata: {},
  });
  assert.equal(missingPhoneBooking.phone, '');
});

test('webhook reports booking failures so delivery can be retried', async (t) => {
  const scenarios = [
    ['HTTP error', async () => Response.json({ error: 'unavailable' }, { status: 500 })],
    ['unsaved booking', async () => Response.json({ success: false })],
    ['invalid response', async () => new Response('not JSON')],
    ['network error', async () => { throw new Error('connection failed'); }],
  ];
  for (const [name, bookingResult] of scenarios) {
    await t.test(name, async () => {
      const routes = await createRoutes(bookingResult);
      const response = await postWebhook(routes, {
        id: 'cs_test',
        customer_email: 'customer@example.com',
        metadata: {},
      });
      assert.equal(response.status, 500);
    });
  }
});

test('webhook uses the email collected during checkout', async () => {
  const routes = await createRoutes();
  const booking = await deliverWebhook(routes, {
    id: 'cs_collected_email',
    customer_email: null,
    customer_details: { email: 'collected@example.com' },
    metadata: {},
  });
  assert.equal(booking.email, 'collected@example.com');
});

test('webhook prefers the final checkout email to a prefilled email', async () => {
  const routes = await createRoutes();
  const booking = await deliverWebhook(routes, {
    id: 'cs_changed_email',
    customer_email: 'prefilled@example.com',
    customer_details: { email: 'changed@example.com' },
    metadata: {},
  });
  assert.equal(booking.email, 'changed@example.com');
});

test('webhook reports missing customer email as a processing failure', async () => {
  const routes = await createRoutes();
  const response = await postWebhook(routes, { id: 'cs_test', metadata: {} });
  assert.equal(response.status, 500);
  assert.equal(routes.getBooking(), undefined);
});

test('a failed delivery succeeds when the booking API recovers', async () => {
  let attempts = 0;
  const routes = await createRoutes(async () => {
    attempts += 1;
    return attempts === 1
      ? Response.json({ error: 'unavailable' }, { status: 503 })
      : Response.json({ success: true });
  });
  const session = { id: 'cs_retry', customer_email: 'customer@example.com', metadata: {} };
  assert.equal((await postWebhook(routes, session)).status, 500);
  assert.equal((await postWebhook(routes, session)).status, 200);
  assert.equal(attempts, 2);
  assert.equal(routes.getBooking().sessionId, session.id);
});
