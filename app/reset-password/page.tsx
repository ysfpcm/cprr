"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Get email and token from URL params
    const emailParam = searchParams.get("email")
    const tokenParam = searchParams.get("token")
    
    if (!emailParam || !tokenParam) {
      setError("Invalid password reset link. Please request a new one.")
      return
    }
    
    setEmail(emailParam)
    setToken(tokenParam)
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match")
      setIsSubmitting(false)
      return
    }

    if (formData.newPassword.length < 8) {
      setError("New password must be at least 8 characters long")
      setIsSubmitting(false)
      return
    }

    try {      
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          token,
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to reset password")
        setIsSubmitting(false)
        return
      }

      setSuccess(true)
      setIsSubmitting(false)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
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
                Reset Password
              </h1>
              <p className="mx-auto max-w-[700px] text-white md:text-xl">
                Create a new password for your account
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reset Password Form Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-md">
          <motion.div
            className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Create New Password</h2>

            {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-200">{error}</div>}

            {success ? (
              <div className="mb-4 p-4 rounded-md bg-green-50 text-green-700 border border-green-200">
                <p className="font-medium">Password Reset Successfully!</p>
                <p className="mt-1 text-sm">
                  Your password has been updated. You will be redirected to the login page shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="oldPassword" className="text-sm font-medium">
                    Current Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="oldPassword"
                      name="oldPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={formData.oldPassword}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 pl-10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 pl-10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 pl-10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white shadow transition-colors hover:bg-red-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Resetting..." : "Reset Password"}
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

// Loading fallback component
function LoadingResetPassword() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Loading...</h2>
        <p className="text-gray-600">Please wait while we prepare the password reset page</p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingResetPassword />}>
      <ResetPasswordContent />
    </Suspense>
  )
} 