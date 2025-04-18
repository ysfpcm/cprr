import { NextRequest } from 'next/server'
// import { Resend } from 'resend' // Removed unused import
// import EmailTemplate from '@/app/components/EmailTemplate' // Removed unused import

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

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    console.log('Email API received data:', body)
    
    // Extract key information
    const { 
      serviceName, 
      dateTime, 
      // firstName, // Removed unused variable
      // lastName, // Removed unused variable
      email, 
      phone, 
      message 
    } = body
    
    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters', 
          details: 'Email address is required'
        }),
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }
    
    // Format date for display if provided
    let formattedDate = null
    if (dateTime) {
      try {
        // Handle different date formats (ISO, MM/DD/YYYY, etc.)
        const dateObj = new Date(dateTime)
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        }
      } catch (e) {
        console.warn('Error formatting date:', e)
        // Use the original date string as fallback
        formattedDate = dateTime
      }
    }
    
    // Log that we received the booking, but will not be sending an email
    console.log('Booking information received for:', email)
    console.log('Note: Email sending via SendGrid has been disabled - SimplyBookMe will handle confirmation emails')
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking information received successfully. SimplyBookMe will send confirmation emails directly.',
        recipient: email,
        details: {
          service: serviceName,
          date: formattedDate || dateTime,
          time: dateTime,
          participants: 1,
          ...(phone && { phone }),
          ...(message && { message })
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
    console.error('Error in email API:', error)
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process email request',
        details: error instanceof Error ? error.message : String(error)
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
}