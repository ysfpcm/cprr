import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import sgMail from "@sendgrid/mail"

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

// Admin emails that are allowed to reset their password
const ADMIN_EMAILS = ["marlx0879@gmail.com", "info@anytimecpr.com"]

// Store reset tokens with expiration (in-memory storage, would use a database in production)
// Key: email, Value: { token: string, expires: Date }
const resetTokenStore = new Map()

// Helper function to verify token directly within this route handler
function verifyToken(email: string, token: string) {
  if (!resetTokenStore.has(email)) {
    return { valid: false, reason: "no_token" };
  }
  
  const storedData = resetTokenStore.get(email);
  const now = new Date();
  
  // Check if token has expired
  if (now > storedData.expires) {
    // Clean up expired token
    resetTokenStore.delete(email);
    return { valid: false, reason: "expired" };
  }
  
  // Verify token
  if (storedData.token !== token) {
    return { valid: false, reason: "invalid" };
  }
  
  return { valid: true };
}

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

    // Generate a random token
    const token = crypto.randomBytes(32).toString("hex")
    
    // Set expiration time (1 hour from now)
    const expires = new Date(Date.now() + 60 * 60 * 1000)
    
    // Store token with expiration
    resetTokenStore.set(email, { token, expires })
    
    // Get the from email from environment
    const fromEmail = process.env.SENDGRID_VERIFIED_SENDER || 
                      process.env.SENDGRID_FROM_EMAIL || 
                      "info@anytimecpr.com"

    // Generate reset URL (NOTE: Update this URL with your actual domain in production)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    process.env.VERCEL_URL || 
                    "http://localhost:3000"
    const resetUrl = `${baseUrl}/reset-password?email=${encodeURIComponent(email)}&token=${token}`

    // Email content with reset link
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e4; border-radius: 5px;">
        <div style="text-align: center; background-color: #4a89de; padding: 15px; border-radius: 5px 5px 0 0;">
          <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        
        <div style="padding: 20px;">
          <p>Hello Admin,</p>
          
          <p>We received a request to reset your password for your Anytime CPR & Health Services account. Please click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4a89de; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
          </div>
          
          <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          
          <p><strong>This link will expire in 1 hour.</strong></p>
          
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
      subject: "Reset Your Password - Anytime CPR & Health Services",
      html: emailContent,
    }

    // Send the email
    await sgMail.send(emailData)

    return NextResponse.json({ 
      success: true, 
      message: "Password reset link sent successfully" 
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Failed to send password reset link" },
      { status: 500 }
    )
  }
}

// Verify the reset token
export async function PUT(request: NextRequest) {
  try {
    const { email, token } = await request.json()

    const verification = verifyToken(email, token);
    
    if (!verification.valid) {
      let errorMessage = "Invalid reset token";
      const errorStatus = 400;
      
      if (verification.reason === "no_token") {
        errorMessage = "No password reset request found for this email";
      } else if (verification.reason === "expired") {
        errorMessage = "Password reset link has expired. Please request a new one.";
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: errorStatus }
      );
    }

    // In a real app, you'd verify the old password and update with new password in the database
    // For this mock system, we'd need to pass this to NextAuth to update the user's password
    // This is simplified since we're using in-memory storage

    // Clean up used token
    resetTokenStore.delete(email)

    return NextResponse.json({ 
      success: true, 
      message: "Password has been reset successfully"
    })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
} 