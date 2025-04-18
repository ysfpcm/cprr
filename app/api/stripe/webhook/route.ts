import { NextResponse } from 'next/server'
import Stripe from 'stripe'

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

// Add this helper function at the top of the file
function getSimplybookEventIdForService(serviceName: string): number {
  // Map service names to SimplyBookMe event IDs
  const serviceMap: Record<string, number> = {
    "BLS for Healthcare Providers": 2,
    "CPR & First Aid Certification (AHA Guidelines)": 3,
    "First Aid Certification (AHA Guidelines)": 4,
    "Pediatric Training": 5,
    "Babysitter Course": 6,
    "Test Payment (DELETE LATER)": 7,
  };

  // Try to find a direct match first
  if (serviceName in serviceMap) {
    return serviceMap[serviceName];
  }

  // If no direct match, try case-insensitive match
  const lowerServiceName = serviceName.toLowerCase();
  for (const [name, id] of Object.entries(serviceMap)) {
    if (name.toLowerCase() === lowerServiceName) {
      return id;
    }
  }

  // If no match found, check for partial matches
  for (const [name, id] of Object.entries(serviceMap)) {
    if (name.toLowerCase().includes(lowerServiceName) || 
        lowerServiceName.includes(name.toLowerCase())) {
      return id;
    }
  }

  // Default to 1 if no match found
  console.warn(`No SimplyBookMe event ID mapping found for "${serviceName}", defaulting to 1`);
  return 1;
}

// Helper to process checkout.session.completed event
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, request: Request) {
  try {
    console.log('Processing successful checkout session:', session.id)
    
    // Get customer email from the session
    const customerEmail = session.customer_email
    
    // Get the metadata containing booking details
    const metadata = session.metadata || {}
    const { service, date, time, participants, customerName } = metadata
    
    if (!customerEmail) {
      console.error('Customer email missing from session:', session.id)
      return false
    }
    
    // Log detailed information about email request
    console.log('Preparing to send confirmation email to:', customerEmail, {
      name: customerName || 'Valued Customer',
      service,
      date,
      time,
      participants
    })
    
    // Send confirmation email - ensure we use a full URL
    const baseUrl = getBaseUrl(request);
    
    const emailUrl = `${baseUrl}/api/email`
    console.log('Sending email request to:', emailUrl)
    
    try {
      // Save booking data internally and trigger Simplybook.me integration
      const bookingApiUrl = `${baseUrl}/api/bookings`
      console.log('Calling booking API endpoint:', bookingApiUrl)
      
      try {
        const bookingResponse = await fetch(bookingApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientName: customerName || 'Valued Customer',
            email: customerEmail,
            phone: session.customer_details?.phone || '', // Try to get phone from Stripe customer details
            service,
            participants: Number(participants) || 1,
            date: date, // Use original date from Stripe metadata instead of converting to ISO
            time,
            status: 'upcoming',
            notes: `Booking from Stripe checkout.`,
            sessionId: session.id,
            simplybookEventId: getSimplybookEventIdForService(service) // Add SimplyBookMe event ID
          }),
        })
        
        console.log('Booking save response status:', bookingResponse.status)
        
        if (!bookingResponse.ok) {
          console.error('Failed to save booking data for dashboard:', await bookingResponse.text())
        } else {
          console.log('Booking data saved successfully for dashboard')
          console.log('Note: Email sending via SendGrid has been disabled - SimplyBookMe will handle confirmation emails')
        }
      } catch (bookingError) {
        console.error('Error saving booking data:', bookingError)
      }
      
      // Return detailed success response with booking information
      return NextResponse.json({ 
        received: true, 
        message: 'Booking processed successfully', 
        bookingInfo: {
          email: customerEmail,
          service,
          date,
          time,
          participants
        }
      })
    } catch (error) {
      console.error('Error processing checkout completion:', error)
      return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error processing checkout session:', error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')
    
    // Allow webhook to work in development even without a webhook secret
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    // In production, we strictly need the webhook secret
    if (!process.env.STRIPE_WEBHOOK_SECRET && !isDevelopment) {
      console.error('Missing Stripe webhook secret in production environment')
      throw new Error('Missing Stripe webhook secret')
    }
    
    if (!signature && !isDevelopment) {
      console.error('Missing stripe-signature header in request')
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }
    
    // Verify the webhook signature (except in development mode)
    let event: Stripe.Event
    
    // Allow testing in development without signature, or with test_signature
    const isTestMode = isDevelopment && (!signature || signature === 'test_signature')
    
    if (isTestMode) {
      // For testing: parse the body directly without signature verification
      console.log('⚠️ WEBHOOK TEST MODE: Bypassing signature verification')
      try {
        event = JSON.parse(body) as Stripe.Event
      } catch (parseError) {
        console.error('Failed to parse webhook body:', parseError)
        return NextResponse.json(
          { error: 'Invalid webhook payload' },
          { status: 400 }
        )
      }
    } else {
      // For production: verify the signature
      try {
        if (!signature) {
          throw new Error('Missing stripe-signature header')
        }
        
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
          throw new Error('Missing Stripe webhook secret')
        }
        
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        )
      } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json(
          { error: 'Webhook signature verification failed', details: (err as Error).message },
          { status: 400 }
        )
      }
    }
    
    // Log the received event
    console.log('Webhook received event type:', event.type)
    
    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      
      // Process the completed checkout session
      const success = await handleCheckoutSessionCompleted(session, request)
      
      if (!success) {
        console.warn('Failed to process checkout session completely:', session.id)
      }
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Unknown webhook error' },
      { status: 500 }
    )
  }
} 