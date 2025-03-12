"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Check } from "lucide-react"
import { format } from "date-fns"

export default function SchedulePage() {
  const [date, setDate] = useState<Date | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    participants: "1",
    service: "",
    time: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [errors, setErrors] = useState<{
    date?: string
    service?: string
    time?: string
  }>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateSelect = (selectedDate: Date) => {
    setDate(selectedDate)
    setShowCalendar(false)
    setErrors((prev) => ({ ...prev, date: undefined }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const newErrors: {
      date?: string
      service?: string
      time?: string
    } = {}

    if (!date) {
      newErrors.date = "Please select a date"
    }

    if (!formData.service) {
      newErrors.service = "Please select a service"
    }

    if (!formData.time) {
      newErrors.time = "Please select a time"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      console.log("Booking submitted:", { ...formData, date })
      setIsSubmitting(false)
      setSubmitSuccess(true)

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        participants: "1",
        service: "",
        time: "",
      })
      setDate(null)

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 5000)
    }, 1000)
  }

  const availableTimeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"]

  const services = [
    { id: "cpr", name: "CPR Training", price: "$75 per person" },
    { id: "first-aid", name: "First Aid Certification", price: "$85 per person" },
    { id: "bls", name: "BLS for Healthcare Providers", price: "$95 per person" },
    { id: "pediatric", name: "Pediatric Training", price: "$85 per person" },
    { id: "babysitter", name: "Babysitter Course", price: "$65 per person" },
  ]

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
                Schedule Your Training
              </h1>
              <p className="mx-auto max-w-[700px] text-white md:text-xl">
                Book your CPR or First Aid training session with our easy online scheduling system.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Scheduling Section */}
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
                <h2 className="text-3xl font-bold tracking-tighter">Book Your Session</h2>
                <p className="text-gray-500 mt-2">Select your preferred date, time, and training service.</p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-2">Available Services</h3>
                <p className="text-sm text-gray-500 mb-4">Choose the training you need</p>

                <div className="space-y-3">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={service.id}
                        name="service"
                        value={service.id}
                        checked={formData.service === service.id}
                        onChange={handleChange}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <label htmlFor={service.id} className="flex flex-col">
                        <span className="font-medium">{service.name}</span>
                        <span className="text-sm text-gray-500">{service.price}</span>
                      </label>
                    </div>
                  ))}
                </div>

                {errors.service && <p className="mt-2 text-sm text-red-600">{errors.service}</p>}

                <p className="text-sm text-gray-500 mt-6">
                  Group discounts available for 5+ participants. Contact us for corporate rates.
                </p>
              </div>
            </motion.div>

            <motion.form
              onSubmit={handleSubmit}
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="participants" className="text-sm font-medium">
                  Number of Participants
                </label>
                <select
                  id="participants"
                  name="participants"
                  value={formData.participants}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num.toString()}>
                      {num} {num === 1 ? "person" : "people"}
                    </option>
                  ))}
                  <option value="more">More than 10 (Group)</option>
                </select>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Date</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="w-full flex justify-start items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </button>

                    {showCalendar && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg p-4">
                        <div className="grid grid-cols-7 gap-2">
                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                            <div key={day} className="text-center text-xs font-medium text-gray-500">
                              {day}
                            </div>
                          ))}
                          {Array.from({ length: 35 }).map((_, i) => {
                            const d = new Date()
                            d.setDate(d.getDate() - d.getDay() + i)
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleDateSelect(d)}
                                className={`text-center text-sm rounded-md p-2 hover:bg-gray-100 ${
                                  date && d.toDateString() === date.toDateString() ? "bg-red-100 text-red-600" : ""
                                }`}
                              >
                                {d.getDate()}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
                </div>
                <div className="space-y-2">
                  <label htmlFor="time" className="text-sm font-medium">
                    Select Time
                  </label>
                  <select
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select time slot</option>
                    {availableTimeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  {errors.time && <p className="text-sm text-red-600">{errors.time}</p>}
                </div>
              </div>
              <button
                type="submit"
                className="w-full inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white shadow transition-colors hover:bg-red-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Book Training Session"}
              </button>

              {submitSuccess && (
                <motion.div
                  className="p-4 rounded-md bg-green-50 text-green-700 border border-green-200"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  Your training has been scheduled. Check your email for details.
                </motion.div>
              )}

              <p className="text-sm text-gray-500 text-center">
                By booking, you agree to our cancellation policy. Cancellations must be made at least 24 hours in
                advance.
              </p>
            </motion.form>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">What Our Clients Say</h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                Hear from individuals and organizations who have completed our training programs.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-8">
              {[
                {
                  quote:
                    "The CPR training was excellent. The instructor was knowledgeable and made the material easy to understand. I feel confident in my ability to respond in an emergency.",
                  name: "Sarah Johnson",
                  title: "Teacher",
                },
                {
                  quote:
                    "We had Anytime CPR come to our office for a corporate training session. The entire process was smooth, and our team learned valuable skills. Highly recommend!",
                  name: "Michael Rodriguez",
                  title: "HR Manager",
                },
                {
                  quote:
                    "The BLS certification course was comprehensive and hands-on. As a healthcare professional, I appreciate the attention to detail and focus on real-world scenarios.",
                  name: "Dr. Lisa Chen",
                  title: "Dentist",
                },
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-red-100 p-2">
                      <Check className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm leading-relaxed">"{testimonial.quote}"</p>
                      <p className="mt-2 text-sm font-medium">{testimonial.name}</p>
                      <p className="text-xs text-gray-500">{testimonial.title}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

