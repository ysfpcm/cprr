"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Calendar, CheckCircle, Mail } from "lucide-react"

export default function BookingConfirmationPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-green-600">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            className="flex flex-col items-center space-y-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center p-2 bg-white/10 rounded-full mb-2">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                Booking Confirmed!
              </h1>
              <p className="mx-auto max-w-[700px] text-white md:text-xl">
                Thank you for scheduling your training with Anytime CPR
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Confirmation Details */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-3xl">
          <motion.div
            className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Your Training is Scheduled</h2>
              <p className="text-gray-500 mt-2">
                We've sent a confirmation email with all the details. Please check your inbox.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">What's Next?</h3>
                  <ul className="mt-2 space-y-2 text-sm text-gray-500">
                    <li className="flex items-start">
                      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-green-600 mt-1.5"></span>
                      <span>Arrive 15 minutes before your scheduled time</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-green-600 mt-1.5"></span>
                      <span>Wear comfortable clothing that allows for movement</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-green-600 mt-1.5"></span>
                      <span>Bring a valid ID for certification purposes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-green-600 mt-1.5"></span>
                      <span>No prior experience is necessary - we'll teach you everything you need to know</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Mail className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Need to Make Changes?</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    If you need to reschedule or cancel your booking, please contact us at least 24 hours in advance.
                    You can email us at{" "}
                    <a href="mailto:info@anytimecpr.com" className="text-green-600 hover:text-green-800">
                      info@anytimecpr.com
                    </a>{" "}
                    or call us at{" "}
                    <a href="tel:5551234567" className="text-green-600 hover:text-green-800">
                      (555) 123-4567
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-6 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

