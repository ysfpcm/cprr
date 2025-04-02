import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY
if (!apiKey) {
  console.error('SENDGRID_API_KEY is not set in environment variables')
}
sgMail.setApiKey(apiKey as string)

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

    // Validate environment variables
    const toEmail = process.env.CONTACT_EMAIL || process.env.SENDGRID_VERIFIED_SENDER
    const fromEmail = process.env.SENDGRID_FROM_EMAIL

    if (!fromEmail) {
      console.error('Missing SENDGRID_FROM_EMAIL environment variable')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Prepare email content
    const msg = {
      to: toEmail || fromEmail, // If toEmail is still undefined, use fromEmail as fallback
      from: fromEmail,
      subject: `New Contact Form Submission from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone || 'Not provided'}
        
        Message:
        ${message}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <br/>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      `,
    }

    console.log('Attempting to send email with config:', {
      to: toEmail || fromEmail,
      from: fromEmail,
      subject: msg.subject,
    })

    // Send email using SendGrid
    await sgMail.send(msg)

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('SendGrid Error:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
} 