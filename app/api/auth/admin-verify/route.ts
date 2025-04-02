import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import sgMail from "@sendgrid/mail"

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

// Admin emails that are allowed to access the dashboard
const ADMIN_EMAILS = ["marlx0879@gmail.com", "info@anytimecpr.com"]

// Store OTP codes with expiration (in-memory storage, would use a database in production)
// Key: email, Value: { otp: string, expires: Date }
const otpStore = new Map()

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Check if email is in the allowed admin list
    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.json(
        { error: "Unauthorized. This email is not registered as an admin." },
        { status: 403 }
      )
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString()
    
    // Set expiration time (5 minutes from now)
    const expires = new Date(Date.now() + 5 * 60 * 1000)
    
    // Store OTP with expiration
    otpStore.set(email, { otp, expires })
    
    // Get the from email from environment
    const fromEmail = process.env.SENDGRID_VERIFIED_SENDER || 
                      process.env.SENDGRID_FROM_EMAIL || 
                      "info@anytimecpr.com"

    // Email content with OTP
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e4; border-radius: 5px;">
        <div style="text-align: center; background-color: #4a89de; padding: 15px; border-radius: 5px 5px 0 0;">
          <h1 style="color: white; margin: 0;">Admin Dashboard Access</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Hello Admin,</p>
          
          <p>Your one-time verification code for Anytime CPR & Health Services dashboard access is:</p>
          
          <div style="background-color: #f9f9f9; border-radius: 5px; padding: 15px; margin: 20px 0; text-align: center;">
            <h2 style="margin: 0; color: #166534; letter-spacing: 5px; font-size: 32px;">${otp}</h2>
          </div>
          
          <p><strong>This code will expire in 5 minutes.</strong></p>
          
          <p>If you did not request this code, please ignore this email or contact support if you have concerns.</p>
          
          <p>Best regards,<br>Anytime CPR & Health Services</p>
        </div>
        
        <div style="text-align: center; padding: 15px; background-color: #f4f4f4; border-radius: 0 0 5px 5px; font-size: 12px; color: #666;">
          <p>© 2024 Anytime CPR & Health Services. All rights reserved.</p>
        </div>
      </div>
    `

    // Email data
    const emailData = {
      to: email,
      from: fromEmail,
      subject: "Your Admin Dashboard Verification Code",
      html: emailContent,
    }

    // Send the email
    await sgMail.send(emailData)

    return NextResponse.json({ success: true, message: "Verification code sent successfully" })
  } catch (error) {
    console.error("Admin verification error:", error)
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    // Check if the email has a stored OTP
    if (!otpStore.has(email)) {
      return NextResponse.json(
        { error: "No verification code found for this email" },
        { status: 400 }
      )
    }

    const storedData = otpStore.get(email)
    const now = new Date()

    // Check if OTP has expired
    if (now > storedData.expires) {
      // Clean up expired OTP
      otpStore.delete(email)
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      )
    }

    // Clean up used OTP
    otpStore.delete(email)

    // Return success with a JWT token or session data
    // In a real app, you would create a JWT or session
    return NextResponse.json({ 
      success: true, 
      message: "Verification successful",
      verified: true,
      admin: true
    })
  } catch (error) {
    console.error("OTP verification error:", error)
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    )
  }
} 