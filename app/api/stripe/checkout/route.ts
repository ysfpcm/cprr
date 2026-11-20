import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServiceTotalCents, services } from '../../../lib/services'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

function isValidBookingDate(date: string): boolean {
  const months = ['january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december']
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const named = /^([a-z]+)\s+(\d{1,2}),\s+(\d{4})$/i.exec(date)
  if (!iso && !named) return false

  const year = Number(iso ? iso[1] : named![3])
  const month = iso ? Number(iso[2]) : months.indexOf(named![1].toLowerCase()) + 1
  const day = Number(iso ? iso[3] : named![2])
  if (year < 1 || month < 1 || month > 12 || day < 1) return false

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day <= daysInMonth[month - 1]
}

function isValidBookingTime(time: string): boolean {
  const twelveHour = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time)
  if (twelveHour) {
    const hours = Number(twelveHour[1])
    return hours >= 1 && hours <= 12 && Number(twelveHour[2]) < 60
  }

  const twentyFourHour = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(time)
  return !!twentyFourHour && Number(twentyFourHour[1]) < 24 && Number(twentyFourHour[2]) < 60 &&
    (!twentyFourHour[3] || (twentyFourHour[1].length === 2 && Number(twentyFourHour[3]) < 60))
}

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
    const date = typeof body?.date === 'string' ? body.date.trim() : ''
    const time = typeof body?.time === 'string' ? body.time.trim() : ''
    if (!date || !time) {
      return NextResponse.json({ error: 'Booking date and time are required' }, { status: 400 })
    }
    if (!isValidBookingDate(date) || !isValidBookingTime(time)) {
      return NextResponse.json({ error: 'Invalid booking date or time' }, { status: 400 })
    }
    const unitValue = body?.unitId
    const unitId = typeof unitValue === 'string' && /^[1-9]\d*$/.test(unitValue)
      ? Number(unitValue)
      : typeof unitValue === 'number' ? unitValue : NaN
    if (unitValue != null && (!Number.isSafeInteger(unitId) || unitId < 1)) {
      return NextResponse.json({ error: 'Invalid instructor ID' }, { status: 400 })
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
              description: `Training session on ${date} at ${time} for ${participants} participant(s)`,
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
        date,
        time,
        participants: String(participants),
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: typeof body.phone === 'string' ? body.phone : '',
        ...(unitValue != null ? { unitId: String(unitId) } : {}),
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
