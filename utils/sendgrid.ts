import * as sgMail from '@sendgrid/mail'

// Initialize SendGrid with API key
const sendGrid = sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export interface BookingEmailData {
  name: string
  email: string
  service: string
  date: string
  time: string
  participants: string
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  try {
    const emailData = {
      to: data.email,
      from: process.env.SENDGRID_FROM_EMAIL!, // Use environment variable
      subject: 'Booking Confirmation - Anytime CPR & Health Services',
      templateId: process.env.SENDGRID_TEMPLATE_ID!, // Use environment variable
      dynamicTemplateData: {
        name: data.name,
        service: data.service,
        date: data.date,
        time: data.time,
        participants: data.participants,
      }
    }

    await sgMail.send(emailData)
    return { success: true }
  } catch (error) {
    console.error('SendGrid error:', error)
    return { success: false, error }
  }
}