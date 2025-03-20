// Test script for webhook functionality
require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const crypto = require('crypto');

// Mock a Stripe checkout.session.completed event
async function mockStripeWebhook() {
  try {
    console.log('Simulating Stripe webhook event...');
    
    // Create a mock session object similar to what Stripe would send
    const mockSession = {
      id: `cs_test_${Date.now()}`,
      object: 'checkout.session',
      customer_email: process.env.SENDGRID_FROM_EMAIL || 'marlx0879@gmail.com', // Send to yourself for testing
      metadata: {
        service: 'CPR Basic Training',
        date: new Date().toISOString().split('T')[0],
        time: '2:00 PM',
        participants: '2',
        customerName: 'Test Customer',
      },
      payment_status: 'paid',
    };
    
    // Create a mock event object
    const mockEvent = {
      id: `evt_${Date.now()}`,
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: mockSession,
      },
    };
    
    console.log('Mock event created:', mockEvent);
    
    // Get webhook secret for signing (for actual testing)
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // This is a simplified approach - in real world, you'd need to properly sign the payload as Stripe does
    // But for local testing by directly calling our webhook endpoint, we can bypass signature verification
    
    // Call your webhook endpoint directly with the mock event
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In real life, Stripe would sign the payload - we're bypassing that for simple testing
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(mockEvent),
    });
    
    const result = await response.text();
    
    console.log('Webhook response status:', response.status);
    console.log('Webhook response body:', result);
    
    if (response.ok) {
      console.log('Webhook processed successfully!');
    } else {
      console.error('Webhook processing failed!');
    }
  } catch (error) {
    console.error('Error simulating webhook:', error);
  }
}

// Run the test
mockStripeWebhook(); 