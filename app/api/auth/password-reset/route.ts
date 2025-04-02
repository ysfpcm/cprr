import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { resetTokenStore } from "../forgot-password/route"

// This is a reference to the mock user database from [...nextauth]/route.ts
// In a real app, you would use a proper database access method
// This is a simplified version for the demo
const users = [
  {
    id: "1",
    name: "Demo User",
    email: "user@example.com",
    password: "$2a$10$8Pn/nSO8wZ9kuyp9nVy.XOZaJG0XvOKn7a9Wn1t9PFG.X5TE.Ysuy",
  },
  {
    id: "2",
    name: "Admin User",
    email: "marlx0879@gmail.com",
    password: "$2a$10$mQNWXJT2aRyLJJC9whYLke/dJ7uoUawY5/yQfanwolSVu9MPUcOT.",
    isAdmin: true,
  },
  {
    id: "3",
    name: "Admin User",
    email: "info@anytimecpr.com",
    password: "$2a$10$mQNWXJT2aRyLJJC9whYLke/dJ7uoUawY5/yQfanwolSVu9MPUcOT.",
    isAdmin: true,
  },
]

export async function POST(request: NextRequest) {
  try {
    const { email, token, oldPassword, newPassword } = await request.json()

    // Check if there's a valid reset token
    if (!resetTokenStore.has(email)) {
      return NextResponse.json(
        { error: "Invalid or expired reset token. Please request a new password reset." },
        { status: 400 }
      )
    }

    const resetData = resetTokenStore.get(email)
    
    // Verify token
    if (resetData.token !== token) {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 400 }
      )
    }

    // Check if token expired
    if (new Date() > resetData.expires) {
      resetTokenStore.delete(email)
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new password reset." },
        { status: 400 }
      )
    }

    // Find the user
    const userIndex = users.findIndex(user => user.email === email)
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, users[userIndex].password)
    
    if (!isOldPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // Update user password (in a real app, this would update a database record)
    users[userIndex].password = hashedPassword
    
    // Clean up the reset token
    resetTokenStore.delete(email)

    return NextResponse.json({
      success: true,
      message: "Password updated successfully"
    })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
} 