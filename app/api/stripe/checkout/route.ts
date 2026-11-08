import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServiceTotalCents, services } from '../../../lib/services'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// Helper function to get the base URL, ensuring it works in production
function getBaseUrl(request: Request): string {
  // Try to get from environment variable first (most reliable option)
  let baseUrl = '';
  
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '');
  } else if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  } else {
    // Fallback to request origin
    try {
      const url = new URL(request.url);
      baseUrl = url.origin;
    } catch (error) {
      console.warn('Failed to parse URL from request, using default:', error);
      // Last resort fallback - this should be avoided in favor of NEXT_PUBLIC_BASE_URL
      baseUrl = process.env.NODE_ENV === 'production' 
        ? 'www.anytimecprhealthservices.com' 
        : 'http://localhost:3000';
    }
  }
  
  // Ensure the URL has a protocol
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    // Add https:// for all except localhost which should use http://
    if (baseUrl.includes('localhost')) {
      baseUrl = `http://${baseUrl}`;
    } else {
      baseUrl = `https://${baseUrl}`;
    }
  }
  
  console.log('Formatted base URL:', baseUrl);
  return baseUrl;
}

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()

    const service = services.find(item => item.name === body?.service)
    const participantValue = body?.participants
    const participants = typeof participantValue === 'string' && /^[1-9]\d*$/.test(participantValue)
      ? Number(participantValue)
      : typeof participantValue === 'number' ? participantValue : NaN
    if (!service || !Number.isSafeInteger(participants) || participants < 1) {
      return NextResponse.json({ error: 'Invalid service or participant count' }, { status: 400 })
    }
    const amount = getServiceTotalCents(service, participants)
    if (!Number.isSafeInteger(amount)) {
      return NextResponse.json({ error: 'Invalid booking total' }, { status: 400 })
    }
    
    // Log the received data
    console.log('Received request body:', body)

    // Ensure we have a valid base URL for redirects
    const baseUrl = getBaseUrl(request);
    console.log('Using base URL for redirects:', baseUrl);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: service.name,
              description: `Training session on ${body.date} at ${body.time} for ${participants} participant(s)`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      customer_email: body.customerEmail,
      success_url: `${baseUrl}/booking-confirmation?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(body.customerEmail || '')}`,
      cancel_url: `${baseUrl}/schedule`,
      metadata: {
        service: service.name,
        date: body.date,
        time: body.time,
        participants: String(participants),
        customerName: body.customerName,
        customerEmail: body.customerEmail,
      },
    })

    // Log the created session
    console.log('Created session:', session.id)

    return NextResponse.json({ 
      sessionUrl: session.url,
      sessionId: session.id 
    })

  } catch (error) {
    console.error('Stripe API error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Unknown Stripe error' },
      { status: 500 }
    )
  }
}
