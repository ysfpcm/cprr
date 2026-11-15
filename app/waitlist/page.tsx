"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, CheckCircle, Star } from "lucide-react"
import { buildWaitlistEmail } from "../lib/waitlist"

export default function WaitlistPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "both", // Default to both ACLS and PALS
    experience: "",
    notification: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    window.location.href = buildWaitlistEmail(formData)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-blue-500">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            className="flex flex-col items-center space-y-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center p-2 bg-white/10 rounded-full mb-2">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                Ask About Class Updates
              </h1>
              <p className="mx-auto max-w-[700px] text-white md:text-xl">
                Contact us about our ACLS and PALS classes
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Waitlist Form Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-2 items-start">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div>
                <h2 className="text-3xl font-bold tracking-tighter">Coming Soon</h2>
                <p className="text-gray-500 mt-2">
                  We&apos;re excited to announce that we&apos;ll soon be offering Advanced Cardiovascular Life Support (ACLS) and
                  Pediatric Advanced Life Support (PALS) certification classes.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-medium mb-4">What to Expect</h3>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-hospitality-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">ACLS Certification</h4>
                      <p className="text-sm text-gray-500">
                        Advanced Cardiovascular Life Support training for healthcare professionals, focusing on the
                        management of cardiac arrest and peri-arrest emergencies.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-hospitality-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">PALS Certification</h4>
                      <p className="text-sm text-gray-500">
                        Pediatric Advanced Life Support training that focuses on the recognition and treatment of
                        critically ill infants and children.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-hospitality-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Expert Instructors</h4>
                      <p className="text-sm text-gray-500">
                        All classes will be taught by experienced healthcare professionals with extensive backgrounds in
                        emergency and critical care.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-hospitality-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">AHA Certification</h4>
                      <p className="text-sm text-gray-500">
                        Upon successful completion, you&apos;ll receive American Heart Association certification valid for
                        two years.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.form
              onSubmit={handleSubmit}
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-sm text-gray-600">
                This form opens an email draft; review and send it in your email app to contact us.
                If you don&apos;t have an email app, use our <Link href="/contact" className="text-blue-700 underline">contact information</Link> instead.
              </p>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hospitality-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hospitality-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hospitality-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="interest" className="text-sm font-medium">
                  I&apos;m interested in
                </label>
                <select
                  id="interest"
                  name="interest"
                  value={formData.interest}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hospitality-500 focus:border-transparent"
                >
                  <option value="acls">ACLS Only</option>
                  <option value="pals">PALS Only</option>
                  <option value="both">Both ACLS and PALS</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="experience" className="text-sm font-medium">
                  Healthcare Experience
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  placeholder="Please briefly describe your healthcare background (optional)"
                  value={formData.experience}
                  onChange={handleChange}
                  className="min-h-[100px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hospitality-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-start space-x-2">
                <input
                  id="notification"
                  name="notification"
                  type="checkbox"
                  checked={formData.notification}
                  onChange={handleChange}
                  className="h-4 w-4 mt-1 rounded border-gray-300 text-hospitality-600 focus:ring-hospitality-500"
                />
                <label htmlFor="notification" className="text-sm text-gray-500">
                  Please email me when these classes become available.
                </label>
              </div>
              <button
                type="submit"
                className="w-full inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                Open Email Draft
              </button>

              <div className="text-center mt-6">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm text-hospitality-600 hover:text-hospitality-800"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to Home
                </Link>
              </div>
            </motion.form>
          </div>
        </div>
      </section>
    </div>
  )
}
