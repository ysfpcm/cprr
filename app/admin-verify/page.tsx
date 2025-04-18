"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminVerifyPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to login page after 3 seconds
    const timer = setTimeout(() => {
      router.push("/login")
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [router])
  
  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <div className="container mx-auto flex-1 items-center px-4 py-8">
        <div className="mx-auto max-w-md">
          <motion.div
            className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8 flex justify-center">
              <div className="rounded-full bg-yellow-100 p-3">
                <svg
                  className="h-8 w-8 text-yellow-600"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
              </div>
            </div>
            
            <h1 className="mb-4 text-center text-xl font-bold">Two-Factor Authentication Disabled</h1>
            
            <p className="mb-6 text-center text-gray-500">
              Two-factor authentication has been removed. Please login directly with your email and password.
            </p>
            
            <p className="mb-6 text-center text-gray-500">
              Redirecting to login page...
            </p>
            
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 