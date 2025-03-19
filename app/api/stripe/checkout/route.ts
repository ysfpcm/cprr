import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing Stripe secret key')
    }

    const body = await request.json()
    
    // Log the received data
    console.log('Received request body:', body)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: body.service,
              description: `Training session on ${body.date} at ${body.time} for ${body.participants} participant(s)`,
            },
            unit_amount: body.amount,
          },
          quantity: 1,
        },
      ],
      customer_email: body.customerEmail,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/booking-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/schedule`,
      metadata: {
        service: body.service,
        date: body.date,
        time: body.time,
        participants: body.participants,
        customerName: body.customerName,
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