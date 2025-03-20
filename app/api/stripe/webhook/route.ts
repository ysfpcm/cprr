import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// Helper function to get the base URL, ensuring it works in production
function getBaseUrl(request: Request): string {
  // Try to get from environment variable first
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // For Vercel deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Fallback to request origin or localhost
  const url = new URL(request.url);
  return url.origin || 'http://localhost:3000';
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
      const emailResponse = await fetch(emailUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: customerEmail,
          name: customerName || 'Valued Customer',
          service,
          date,
          time,
          participants,
        }),
      })
      
      // Log detailed response information
      console.log('Email API response status:', emailResponse.status)
      
      if (!emailResponse.ok) {
        let errorData: unknown = 'Unable to parse error response'
        try {
          errorData = await emailResponse.json()
        } catch {
          try {
            errorData = await emailResponse.text()
          } catch (textError) {
            console.error('Failed to parse error response as text:', textError)
          }
        }
        console.error('Failed to send confirmation email:', errorData)
        return false
      }
      
      const responseData = await emailResponse.json()
      console.log('Email API response data:', responseData)
      console.log('Confirmation email sent successfully to:', customerEmail)
      return true
    } catch (fetchError) {
      console.error('Error fetching email API:', fetchError)
      return false
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