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

async function createRoutes() {
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
      return Response.json({ success: true });
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
  const response = await routes.webhook.POST(new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'test-signature' },
    body: JSON.stringify({ type: 'checkout.session.completed', data: { object: session } }),
  }));
  assert.equal(response.status, 200);
  return routes.getBooking();
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
