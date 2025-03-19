import sgMail from '@sendgrid/mail'

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      service, 
      date, 
      time, 
      participants 
    } = body

    const emailData = {
      to: email,
      from: 'your-verified-sender@yourdomain.com',
      subject: 'Booking Confirmation - Anytime CPR & Health Services',
      templateId: 'your-template-id', // If using SendGrid templates
      dynamicTemplateData: {
        name,
        service,
        date,
        time,
        participants,
        // Add any other dynamic data you want to include
      }
    }

    await sgMail.send(emailData)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Email sending failed:', error)
    return new Response(JSON.stringify({ error: 'Failed to send confirmation email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}