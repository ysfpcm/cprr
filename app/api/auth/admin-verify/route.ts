import { NextRequest, NextResponse } from "next/server"

// Admin emails that are allowed to access the dashboard
const ADMIN_EMAILS = ["marlx0879@gmail.com", "info@anytimecpr.com"]

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

    // Return a response indicating that 2FA is deprecated
    console.log(`Admin verification requested for: ${email}`)
    console.log('Two-factor authentication has been disabled')

    return NextResponse.json({ 
      success: true, 
      message: "Two-factor authentication has been disabled. Please login directly with your email and password.",
      deprecated: true
    })
  } catch (error) {
    console.error("Admin verification error:", error)
    return NextResponse.json(
      { error: "Failed to process verification request" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Check if email is in the allowed admin list
    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.json(
        { error: "Unauthorized. This email is not registered as an admin." },
        { status: 403 }
      )
    }

    // Return a success response indicating that 2FA is deprecated
    return NextResponse.json({ 
      success: true, 
      message: "Two-factor authentication has been disabled. Please login directly with your email and password.",
      verified: true,
      admin: true,
      deprecated: true
    })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json(
      { error: "Failed to process verification request" },
      { status: 500 }
    )
  }
} 