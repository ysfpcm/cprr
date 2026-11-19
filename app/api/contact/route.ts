import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Contact form delivery is unavailable. Please email info@anytimecprhealthservices.com directly; your message has not been sent.' },
      { status: 503 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    return NextResponse.json(
      { error: 'Failed to process contact form submission' },
      { status: 500 }
    )
  }
}
