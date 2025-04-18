import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // Log the contact form submission
    console.log('Contact form submission received:')
    console.log(`Name: ${name}`)
    console.log(`Email: ${email}`)
    console.log(`Phone: ${phone || 'Not provided'}`)
    console.log(`Message: ${message}`)
    console.log('Note: Email notifications via SendGrid have been disabled')

    // Return success response
    return NextResponse.json(
      { 
        message: 'Contact form submitted successfully. Our team will review your message and contact you directly.',
        note: 'Email sending via SendGrid has been disabled. Please make sure your provided contact information is correct.'
      },
      { status: 200 }
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