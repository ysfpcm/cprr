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
      participants 
    } = body

    // Log incoming request for debugging
    console.log('Email request received with data:', {
      name,
      email,
      service,
      date,
      time,
      participants
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
        details: 'Missing API key'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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
    
    // Special handling for production vs development
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Create email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e4; border-radius: 5px;">
        <div style="text-align: center; background-color: #4ade80; padding: 15px; border-radius: 5px 5px 0 0;">
          <h1 style="color: white; margin: 0;">Booking Confirmation</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Hello ${name || 'Valued Customer'},</p>
          
          <p>Thank you for booking your CPR training with Anytime CPR & Health Services. Your booking has been confirmed!</p>
          
          <div style="background-color: #f9f9f9; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #166534;">Booking Details</h3>
            <p><strong>Service:</strong> ${service || 'CPR Training'}</p>
            <p><strong>Date:</strong> ${formattedDate || 'As scheduled'}</p>
            <p><strong>Time:</strong> ${time || 'As scheduled'}</p>
            <p><strong>Participants:</strong> ${participants || '1'}</p>
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
      subject: 'Booking Confirmation - Anytime CPR & Health Services',
      html: emailContent,
      // Use template if you have one set up
      ...(process.env.SENDGRID_TEMPLATE_ID && {
        templateId: process.env.SENDGRID_TEMPLATE_ID,
        dynamicTemplateData: {
          name: name || 'Valued Customer',
          service: service || 'CPR Training',
          date: formattedDate || 'As scheduled',
          time: time || 'As scheduled',
          participants: participants || '1',
        }
      })
    }

    console.log('Attempting to send email with data:', {
      to: email,
      from: fromEmail,
      subject: 'Booking Confirmation - Anytime CPR & Health Services'
    })

    try {
      // Reinitialize SendGrid with API key to ensure it's set
      if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY)
      }
      
      // Attempt to send the email
      const [response] = await sgMail.send(emailData)
      console.log('SendGrid API response code:', response?.statusCode)
      console.log('Email sent successfully to:', email)
      
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Email sent successfully' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (sendError: unknown) {
      console.error('SendGrid error details:', JSON.stringify(sendError, null, 2))
      
      // Check for sender verification issues
      let errorDetails = 'Unknown SendGrid error';
      let userFriendlyMessage = 'Failed to send confirmation email';
      
      // Type guard for SendGrid error response
      if (
        typeof sendError === 'object' && 
        sendError !== null && 
        'response' in sendError &&
        sendError.response &&
        typeof sendError.response === 'object' &&
        'body' in sendError.response
      ) {
        const sgError = sendError as { response: { body: { errors?: Array<{ message: string }> } } };
        console.error('SendGrid API response:', sgError.response.body)
        
        // Check for specific SendGrid errors
        const errors = sgError.response.body.errors;
        if (errors && errors.length > 0) {
          const firstError = errors[0];
          errorDetails = firstError.message || errorDetails;
          
          // Specific check for sender verification error
          if (errorDetails.includes('from address does not match a verified Sender Identity')) {
            userFriendlyMessage = 'Email configuration error: Sender not verified';
            console.error('CRITICAL: SendGrid sender identity not verified. Please verify the sender email address in your SendGrid account.');
          }
        }
      }
      
      return new Response(JSON.stringify({ 
        error: userFriendlyMessage,
        details: errorDetails
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
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