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

test('checkout return page does not submit a second booking or claim confirmation', () => {
  const confirmation = fs.readFileSync(path.join(__dirname, '../app/booking-confirmation/page.tsx'), 'utf8');
  const schedule = fs.readFileSync(path.join(__dirname, '../app/schedule/page.tsx'), 'utf8');
  assert.doesNotMatch(confirmation, /fetch\s*\(\s*['"]\/api\/bookings/);
  assert.doesNotMatch(confirmation, /Booking Confirmed|Your Training is Scheduled/);
  assert.match(confirmation, /contact us to confirm/i);
  assert.doesNotMatch(schedule, /pendingBooking/);
});

test('checkout phone reaches the webhook booking without Stripe phone collection', async () => {
  let bookingCalls = 0;
  const routes = await createRoutes(async () => { bookingCalls++; return Response.json({ success: true }); });
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
  assert.equal(bookingCalls, 1);
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

async function createBookingsRoute(book = async () => Response.json({ result: { id: 'booking-1' } }), matrix) {
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
      };
      if (request.method === 'book') return book(request);
      if (request.method === 'getStartTimeMatrix' && matrix) return matrix(request);
      if (!(request.method in results)) throw new Error(`Unexpected method: ${request.method}`);
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
  return { post: (booking) => bookings.namespace.POST(new Request('http://localhost/api/bookings', {
    method: 'POST',
    body: JSON.stringify(booking),
  })), context };
}

test('webhook booking sends the selected instructor to SimplyBook', async () => {
  let bookRequest;
  const bookings = await createBookingsRoute(async (request) => {
    bookRequest = request;
    return Response.json({ result: { id: 'booking-1' } });
  });
  const routes = await createRoutes(bookings.post);
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

test('booking checks and suggests availability for the instructor being booked', async (t) => {
  for (const [name, unitId, expectedUnitId] of [
    ['selected instructor', 3, 3],
    ['default instructor', undefined, 2],
  ]) {
    await t.test(name, async () => {
      const matrixRequests = [];
      let bookRequest;
      const bookings = await createBookingsRoute(
        async (request) => {
          bookRequest = request;
          return Response.json({ error: { message: 'Selected event id is not available' } });
        },
        (request) => {
          matrixRequests.push(request);
          if (request.id === 'alternative_timeslots') {
            return Response.json({ result: { '2026-11-21': ['15:00:00'] } });
          }
          return Response.json({ result: { '2026-11-20': request.params[3] === null ? ['14:00:00'] : [] } });
        },
      );
      const response = await bookings.post({
        email: 'customer@example.com', service: 'BLS', simplybookEventId: 2,
        date: '2026-11-20', time: '2:00 PM', unitId,
      });
      const result = await response.json();
      assert.equal(response.status, 500);
      assert.equal(bookRequest.params[1], expectedUnitId);
      assert.equal(matrixRequests[0].params[3], expectedUnitId);
      assert.equal(matrixRequests[1].params[3], expectedUnitId);
      assert.deepEqual(result.alternativeTimes, [{ date: '2026-11-21', slots: ['15:00:00'] }]);
    });
  }
});

test('booking skips alternatives when the selected instructor is available', async () => {
  const matrixRequests = [];
  const bookings = await createBookingsRoute(undefined, (request) => {
    matrixRequests.push(request);
    return Response.json({ result: { '2026-11-20': ['14:00:00'] } });
  });
  const response = await bookings.post({
    email: 'customer@example.com', service: 'BLS', simplybookEventId: 2,
    date: '2026-11-20', time: '2:00 PM', unitId: 3,
  });
  assert.equal(response.status, 200);
  assert.equal(matrixRequests.length, 1);
  assert.equal(matrixRequests[0].params[3], 3);
  assert.equal((await response.json()).alternativeTimes, undefined);
});

test('booking preserves international phone prefixes while formatting US numbers', async (t) => {
  const scenarios = [
    ['international number with ten digits', '+43 1 234 5678', '+4312345678'],
    ['international number with leading whitespace', '  +43 1 234 5678  ', '+4312345678'],
    ['US number', '(713) 555-0123', '+17135550123'],
    ['US number with country code', '+1 (713) 555-0123', '+17135550123'],
    ['missing number', '', '+15555555555'],
  ];
  for (const [name, phone, expected] of scenarios) {
    await t.test(name, async () => {
      let bookRequest;
      const bookings = await createBookingsRoute(async (request) => {
        bookRequest = request;
        return Response.json({ result: { id: 'booking-1' } });
      });
      const response = await bookings.post({
        clientName: 'Test Customer', email: 'customer@example.com', phone,
        service: 'BLS Certification', simplybookEventId: 1, unitId: 3,
        date: '2026-11-20', time: '2:00 PM', sessionId: 'cs_phone',
      });
      assert.equal(response.status, 200);
      assert.equal(bookRequest.params[4].phone, expected);
      assert.equal((await response.json()).bookingDetails.phone, expected);
    });
  }
});

test('SimplyBook failures produce retryable webhook errors despite an internal save', async (t) => {
  const failures = [
    ['JSON-RPC error', async () => Response.json({ error: { message: 'Service unavailable' } })],
    ['HTTP error', async () => Response.json({ error: { message: 'Service unavailable' } }, { status: 503 })],
    ['HTTP error with result', async () => Response.json({ result: { id: 'booking-1' } }, { status: 503 })],
    ['network error', async () => { throw new Error('connection failed'); }],
    ['invalid response', async () => new Response('not JSON')],
    ['missing result', async () => Response.json({})],
  ];
  for (const [name, failure] of failures) {
    await t.test(name, async () => {
      let attempts = 0;
      const bookings = await createBookingsRoute(async (request) => {
        attempts += 1;
        return attempts === 1 ? failure(request) : Response.json({ result: { id: 'booking-1' } });
      });
      const routes = await createRoutes(bookings.post);
      const session = {
        id: 'cs_sync_retry', customer_email: 'customer@example.com',
        metadata: { service: routes.services.services[0].name, date: '2026-11-20', time: '2:00 PM', unitId: '3' },
      };
      assert.equal((await postWebhook(routes, session)).status, 500);
      assert.equal(bookings.context.bookings.length, 1);
      assert.equal((await postWebhook(routes, session)).status, 200);
      assert.equal(bookings.context.bookings.length, 1);
      assert.equal(attempts, 2);
    });
  }
});

test('booking API does not confirm an unsynced internal booking', async () => {
  const bookings = await createBookingsRoute(async () => Response.json({ error: { message: 'Service unavailable' } }));
  const response = await bookings.post({
    email: 'customer@example.com', service: 'Test Payment', simplybookEventId: 8,
    date: '2026-11-20', time: '2:00 PM', sessionId: 'cs_unsynced',
  });
  assert.equal(response.status, 500);
  const result = await response.json();
  assert.equal(result.success, false);
  assert.equal(result.bookingDetails.sessionId, 'cs_unsynced');
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
      body: JSON.stringify({ service: routes.services.services[0].name, participants: 1,
        date: '2026-11-20', time: '2:00 PM', unitId }),
    }));
    assert.equal(response.status, 400);
  }
});

test('checkout rejects missing or invalid booking dates and times before creating a session', async () => {
  for (const field of ['date', 'time']) {
    for (const value of [undefined, null, '', '   ', 42, {}]) {
      const routes = await createRoutes();
      const response = await routes.checkout.POST(new Request('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ service: routes.services.services[0].name, participants: 1,
          date: '2026-11-20', time: '2:00 PM', [field]: value }),
      }));
      assert.equal(response.status, 400, `${field}: ${JSON.stringify(value)}`);
      assert.equal((await response.json()).error, 'Booking date and time are required');
      assert.equal(routes.getCheckout(), undefined);
    }
  }
});

test('checkout rejects malformed calendar dates and times before creating a session', async () => {
  const invalidBookings = [
    { date: 'not a date', time: '2:00 PM' },
    { date: '2026-02-29', time: '2:00 PM' },
    { date: '1900-02-29', time: '2:00 PM' },
    { date: 'April 31, 2026', time: '2:00 PM' },
    { date: '2026-13-01', time: '2:00 PM' },
    { date: '2026-01-00', time: '2:00 PM' },
    { date: '2026-11-20', time: 'not a time' },
    { date: '2026-11-20', time: '0:00 AM' },
    { date: '2026-11-20', time: '13:00 PM' },
    { date: '2026-11-20', time: '2:60 PM' },
    { date: '2026-11-20', time: '24:00:00' },
    { date: '2026-11-20', time: '23:59:60' },
    { date: '2026-11-20', time: '2:00:30' },
    { date: '2026-11-20', time: '2:00 PM extra' },
  ];
  for (const booking of invalidBookings) {
    const routes = await createRoutes();
    const response = await routes.checkout.POST(new Request('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ service: routes.services.services[0].name, participants: 1, ...booking }),
    }));
    assert.equal(response.status, 400, JSON.stringify(booking));
    assert.equal((await response.json()).error, 'Invalid booking date or time');
    assert.equal(routes.getCheckout(), undefined);
  }
});

test('checkout accepts valid calendar dates and supported time formats', async () => {
  const validBookings = [
    { date: 'February 29, 2028', time: '12:00 AM' },
    { date: '2000-02-29', time: '00:00:00' },
    { date: '2028-02-29', time: '12:00 PM' },
    { date: '2026-11-20', time: '23:59' },
    { date: '2026-11-20', time: '23:59:59' },
  ];
  for (const booking of validBookings) {
    const routes = await createRoutes();
    const response = await routes.checkout.POST(new Request('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ service: routes.services.services[0].name, participants: 1, ...booking }),
    }));
    assert.equal(response.status, 200, JSON.stringify(booking));
    assert.equal(routes.getCheckout().metadata.date, booking.date);
    assert.equal(routes.getCheckout().metadata.time, booking.time);
  }
});

test('checkout trims booking dates and times before passing them to the webhook', async () => {
  const routes = await createRoutes();
  const response = await routes.checkout.POST(new Request('http://localhost/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({ service: routes.services.services[0].name, participants: 1,
      date: ' 2026-11-20 ', time: ' 2:00 PM ', customerEmail: 'customer@example.com' }),
  }));
  assert.equal(response.status, 200);
  const checkout = routes.getCheckout();
  assert.equal(checkout.line_items[0].price_data.product_data.description,
    'Training session on 2026-11-20 at 2:00 PM for 1 participant(s)');
  const booking = await deliverWebhook(routes, {
    id: 'cs_trimmed', customer_email: checkout.customer_email, metadata: checkout.metadata,
  });
  assert.equal(booking.date, '2026-11-20');
  assert.equal(booking.time, '2:00 PM');
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
