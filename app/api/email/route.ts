import sgMail from '@sendgrid/mail'

// Initialize SendGrid with your API key
try {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not defined in environment variables')
  } else {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    console.log('SendGrid API key set successfully')
  }
} catch (error) {
  console.error('Error setting SendGrid API key:', error)
}

// Configure CORS headers for production
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      service, 
      date, 
      time, 
      participants,
      sessionId  // Include session ID as a possible parameter
    } = body

    // Log incoming request for debugging
    console.log('Email request received with data:', {
      name,
      email,
      service,
      date,
      time,
      participants,
      sessionId
    })

    // Check if essential fields are present
    if (!email) {
      console.error('Missing required field: email')
      
      // Return more detailed error for debugging
      return new Response(JSON.stringify({ 
        error: 'Missing required field: email',
        receivedBody: JSON.stringify(body)
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate SendGrid API key is set
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured')
      return new Response(JSON.stringify({ 
        error: 'Email service not properly configured',
        supportInfo: 'Please contact support for assistance with your booking.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Set default values for missing fields to ensure the email still works
    const customerName = name || 'Valued Customer'
    const serviceType = service || 'CPR Training'
    const bookingDate = date || 'as scheduled'
    const bookingTime = time || 'at the reserved time'
    const numParticipants = participants || '1'
    
    // Create a subject line that works even with minimal data
    let subjectLine = `Your CPR Training Confirmation`
    if (service) {
      subjectLine = `Your ${service} Confirmation`
    }
    if (sessionId) {
      subjectLine += ` - Ref: ${sessionId.substring(0, 8)}`
    }

    // Format date to be more readable if it's in ISO format
    let formattedDate = date
    try {
      if (date && typeof date === 'string') {
        formattedDate = new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    } catch (dateError) {
      console.warn('Failed to format date:', dateError)
      // Continue with original date value
    }

    // Get the from email from environment and log validation
    const fromEmail = process.env.SENDGRID_VERIFIED_SENDER || process.env.SENDGRID_FROM_EMAIL || 'info@anytimecpr.com'
    console.log('Using sender email:', fromEmail, '(Is environment variable set:', !!process.env.SENDGRID_VERIFIED_SENDER || !!process.env.SENDGRID_FROM_EMAIL, ')')
    
    // Create email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e4; border-radius: 5px;">
        <div style="text-align: center; background-color: #4ade80; padding: 15px; border-radius: 5px 5px 0 0;">
          <h1 style="color: white; margin: 0;">Booking Confirmation</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Hello ${customerName},</p>
          
          <p>Thank you for booking your CPR training with Anytime CPR & Health Services. Your booking has been confirmed!</p>
          
          <div style="background-color: #f9f9f9; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #166534;">Booking Details</h3>
            <p><strong>Service:</strong> ${serviceType}</p>
            <p><strong>Date:</strong> ${formattedDate || bookingDate}</p>
            <p><strong>Time:</strong> ${bookingTime}</p>
            <p><strong>Participants:</strong> ${numParticipants}</p>
          </div>
          
          <h3 style="color: #166534;">What's Next?</h3>
          <ul>
            <li>Arrive 15 minutes before your scheduled time</li>
            <li>Wear comfortable clothing that allows for movement</li>
            <li>Bring a valid ID for certification purposes</li>
            <li>No prior experience is necessary - we'll teach you everything you need to know</li>
          </ul>
          
          <p>If you need to reschedule or cancel your booking, please contact us at least 24 hours in advance at <a href="mailto:info@anytimecpr.com">info@anytimecpr.com</a> or call us at (555) 123-4567.</p>
          
          <p>We look forward to seeing you!</p>
          
          <p>Best regards,<br>The Anytime CPR & Health Services Team</p>
        </div>
        
        <div style="text-align: center; padding: 15px; background-color: #f4f4f4; border-radius: 0 0 5px 5px; font-size: 12px; color: #666;">
          <p>© 2024 Anytime CPR & Health Services. All rights reserved.</p>
        </div>
      </div>
    `

    const emailData = {
      to: email,
      from: fromEmail,
      subject: subjectLine,
      html: emailContent,
      // Use template if you have one set up
      ...(process.env.SENDGRID_TEMPLATE_ID && {
        templateId: process.env.SENDGRID_TEMPLATE_ID,
        dynamicTemplateData: {
          name: customerName,
          service: serviceType,
          date: formattedDate || bookingDate,
          time: bookingTime,
          participants: numParticipants,
          sessionId: sessionId,
        }
      })
    }

    console.log('Attempting to send email with data:', {
      to: email,
      from: fromEmail,
      subject: subjectLine
    })

    try {
      // Reinitialize SendGrid with API key to ensure it's set
      if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      }
      
      // Attempt to send the email
      const response = await sgMail.send(emailData)
      
      // Log successful email send
      console.log('Confirmation email sent successfully to:', email)
      console.log('Email response:', response)
      
      // Return detailed success response
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Confirmation email sent successfully',
          recipient: email,
          details: {
            service: serviceType,
            date: formattedDate || bookingDate,
            time: bookingTime,
            participants: numParticipants,
            ...(sessionId && { reference: sessionId })
          }
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    } catch (error) {
      // Enhanced error handling and logging
      console.error('Failed to send confirmation email:', error)
      
      // Determine if it's a SendGrid error or other type
      const isSendGridError = error && 
        typeof error === 'object' && 
        error !== null &&
        'response' in error && 
        error.response && 
        typeof error.response === 'object' &&
        error.response !== null &&
        'body' in error.response;
      
      // Define a type for the SendGrid error structure
      type SendGridErrorResponse = {
        response: {
          body: unknown;
        };
      };
      
      const errorDetails = isSendGridError 
        ? JSON.stringify((error as SendGridErrorResponse).response.body) 
        : String(error);
        
      return new Response(
        JSON.stringify({
          error: 'Failed to send confirmation email',
          message: 'There was a problem sending your confirmation email. Please contact us for assistance.',
          details: errorDetails,
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }
  } catch (error) {
    console.error('Email sending failed:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to send confirmation email',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}