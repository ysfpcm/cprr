"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Lock } from "lucide-react"
import Link from "next/link"

function AdminVerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [otp, setOtp] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [countdown, setCountdown] = useState(300) // 5 minutes in seconds
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    // Get email from URL params
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
    } else {
      router.push("/login")
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsVerifying(true)

    if (isExpired) {
      setError("Verification code has expired. Please request a new one.")
      setIsVerifying(false)
      return
    }

    try {
      const response = await fetch("/api/auth/admin-verify", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Verification failed")
        setIsVerifying(false)
        return
      }

      // If verification successful, redirect to dashboard
      sessionStorage.setItem("admin_verified", "true")
      sessionStorage.setItem("admin_email", email)
      router.push("/dashboard")
    } catch (err) {
      console.error("Verification error:", err)
      setError("An error occurred during verification. Please try again.")
      setIsVerifying(false)
    }
  }

  const requestNewCode = async () => {
    setError("")
    setIsVerifying(true)

    try {
      const response = await fetch("/api/auth/admin-verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to send new verification code")
        setIsVerifying(false)
        return
      }

      // Reset countdown
      setCountdown(300)
      setIsExpired(false)
      setIsVerifying(false)
    } catch (err) {
      console.error("Error requesting new code:", err)
      setError("An error occurred. Please try again.")
      setIsVerifying(false)
    }
  }

  // Format the time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-blue-600">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            className="flex flex-col items-center space-y-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                Admin Verification
              </h1>
              <p className="mx-auto max-w-[700px] text-white md:text-xl">
                Enter the verification code sent to your email
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Verification Form Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-md">
          <motion.div
            className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Verification Code</h2>

            {error && <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-200">{error}</div>}

            <div className="mb-4 text-center">
              <p className="text-sm text-gray-600">
                We sent a verification code to <span className="font-medium">{email}</span>
              </p>
              <p className="text-sm mt-2 font-medium">
                Code expires in: <span className={isExpired ? "text-red-600" : "text-blue-600"}>{formatTime(countdown)}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium">
                  Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full rounded-md border border-gray-300 pl-10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 disabled:opacity-50"
                disabled={isVerifying}
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={requestNewCode}
                disabled={isVerifying || (!isExpired && countdown > 270)} // Disable resend for first 30 seconds
                className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 disabled:hover:text-blue-600"
              >
                {isExpired ? "Request New Code" : "Resend Code"}
              </button>
            </div>

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
function LoadingVerification() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Loading...</h2>
        <p className="text-gray-600">Please wait while we prepare the verification page</p>
      </div>
    </div>
  )
}

export default function AdminVerifyPage() {
  return (
    <Suspense fallback={<LoadingVerification />}>
      <AdminVerifyContent />
    </Suspense>
  )
} 