"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"

// Admin emails that are allowed to reset their password
const ADMIN_EMAILS = ["marlx0879@gmail.com", "info@anytimecpr.com"]

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccess(false)

    // Check if the email is an admin email
    if (!ADMIN_EMAILS.includes(email)) {
      setError("This email is not authorized to reset the password.")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to send password reset link")
        setIsSubmitting(false)
        return
      }

      setSuccess(true)
      setIsSubmitting(false)
    } catch (err) {
      console.error("Error:", err)
      setError("An error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-red-600">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            className="flex flex-col items-center space-y-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                Forgot Password
              </h1>
              <p className="mx-auto max-w-[700px] text-white md:text-xl">
                Enter your email to reset your password
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Forgot Password Form Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-md">
          <motion.div
            className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Reset Your Password</h2>

            {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-200">{error}</div>}

            {success ? (
              <div className="mb-4 p-4 rounded-md bg-green-50 text-green-700 border border-green-200">
                <p className="font-medium">Password Reset Link Sent!</p>
                <p className="mt-1 text-sm">
                  If your email address is associated with an admin account, you will receive an email with instructions to reset your password.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-md border border-gray-300 pl-10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Enter your email address and we'll send you a link to reset your password.
                  <br />
                  <br />
                  <strong>Note:</strong> Only admin accounts are authorized to reset passwords.
                </p>

                <button
                  type="submit"
                  className="w-full inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white shadow transition-colors hover:bg-red-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            )}

            <div className="text-center mt-6">
              <Link href="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
} 