"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Calendar, Check, CreditCard } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

export default function SchedulePage() {
  const router = useRouter()

  // --- State ---
  const [date, setDate] = useState<Date | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [step, setStep] = useState(1) // Step 1: Form, Step 2: Review, Step 3: Processing
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    participants: "1",
    service: "",
    time: "",
  })

  const [errors, setErrors] = useState<{
    date?: string
    service?: string
    time?: string
  }>({})

  // --- For mapping service or price display on the front-end ---
  const getServicePrice = (serviceId: string) => {
    switch (serviceId) {
      case "cpr":
        return "$75"
      case "first-aid":
        return "$85"
      case "bls":
        return "$95"
      case "pediatric":
        return "$85"
      case "babysitter":
        return "$65"
      case "test":
        return "$0.50"
      default:
        return "$75"
    }
  }

  const getServiceName = (serviceId: string) => {
    switch (serviceId) {
      case "cpr":
        return "CPR Training"
      case "first-aid":
        return "First Aid Certification"
      case "bls":
        return "BLS Certification"
      case "pediatric":
        return "Pediatric Training"
      case "babysitter":
        return "Babysitter Course"
      case "test":
        return "Test Payment (DELETE LATER)"
      default:
        return "Training"
    }
  }

  const availableTimeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"]

  const services = [
    { id: "cpr", name: "CPR Training", price: "$75 per person" },
    { id: "first-aid", name: "First Aid Certification", price: "$85 per person" },
    { id: "bls", name: "BLS for Healthcare Providers", price: "$95 per person" },
    { id: "pediatric", name: "Pediatric Training", price: "$85 per person" },
    { id: "babysitter", name: "Babysitter Course", price: "$65 per person" },
    { id: "test", name: "Test Payment (DELETE LATER)", price: "$0.50 per person" },
  ]

  // --- Handle service selection from query params ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const serviceParam = params.get("service")
    if (serviceParam) {
      // E.g. map "cpr-training" -> "cpr"
      const serviceMap: { [key: string]: string } = {
        "cpr-training": "cpr",
        "bls-certification": "bls",
        "first-aid-certification": "first-aid",
        "pediatric-training": "pediatric",
        "corporate-training": "corporate",
        "babysitter-course": "babysitter",
      }
      const serviceId = serviceMap[serviceParam]
      if (serviceId) {
        setFormData((prev) => ({ ...prev, service: serviceId }))
      }
    }
  }, [])

  // --- Form Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateSelect = (selectedDate: Date) => {
    setDate(selectedDate)
    setShowCalendar(false)
    setErrors((prev) => ({ ...prev, date: undefined }))
  }

  const handleSubmitForm = (e: React.FormEvent) => {
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

    // Move to Review Step
    setStep(2)
  }

  const handleSubmitBooking = async () => {
    // Your validation code...
    if (!date) {
      setErrors({
        ...errors,
        date: 'Please select a date',
      })
      return
    }
    
    // Other validation...
    
    setIsSubmitting(true)

    try {
      // Calculate amount based on service and participants
      const participants = Number.parseInt(formData.participants)
      let amount = 0

      switch (formData.service) {
        case "cpr":
          amount = 7500 * participants // $75 per person
          break
        case "first-aid":
          amount = 8500 * participants // $85 per person
          break
        case "bls":
          amount = 9500 * participants // $95 per person
          break
        case "pediatric":
          amount = 8500 * participants // $85 per person
          break
        case "babysitter":
          amount = 6500 * participants // $65 per person
          break
        case "test":
          amount = 50 * participants // $0.50 per person
          break
        default:
          amount = 7500 * participants // Default to $75
      }

      // Save booking details to localStorage before redirecting
      const bookingData = {
        email: formData.email,
        customerEmail: formData.email,
        name: formData.name,
        customerName: formData.name,
        service: getServiceName(formData.service),
        date: date ? format(date, 'MMMM d, yyyy') : '',
        time: formData.time,
        participants: formData.participants,
      }
      
      // Save to localStorage for retrieval after payment
      localStorage.setItem('pendingBooking', JSON.stringify(bookingData))
      
      console.log('Saved booking data to localStorage:', bookingData)

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          service: getServiceName(formData.service),
          date: date ? format(date, 'MMMM d, yyyy') : '',
          time: formData.time,
          participants: formData.participants,
          customerEmail: formData.email,
          customerName: formData.name,
        }),
      })

      // Add error logging
      if (!response.ok) {
        const text = await response.text() // Use text() instead of json() for debugging
        console.error('Response not OK:', text)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl
      } else {
        throw new Error('No session URL returned')
      }

    } catch (error) {
      console.error('Booking error:', error)
      setPaymentError('There was a problem processing your booking. Please try again.')
      setIsSubmitting(false)
    }
  }

  // --- Render ---
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
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-white">
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
          {step === 1 && (
            <div className="grid gap-6 lg:grid-cols-2 items-start">
              {/* Service List */}
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

              {/* Form */}
              <motion.form
                onSubmit={handleSubmitForm}
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
                >
                  Continue to Review
                </button>

                <p className="text-sm text-gray-500 text-center">
                  By booking, you agree to our cancellation policy. Cancellations must be made at least 24 hours in advance.
                </p>
              </motion.form>
            </div>
          )}

          {step === 2 && (
            <motion.div
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-6 text-center">Review Your Booking</h2>
                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-medium mb-2">Training Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Service</p>
                        <p className="font-medium">{getServiceName(formData.service)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="font-medium">{getServicePrice(formData.service)} per person</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium">{date ? format(date, "MMMM d, yyyy") : "Not selected"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium">{formData.time}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Participants</p>
                        <p className="font-medium">{formData.participants}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="font-medium text-red-600">
                          $
                          {Number.parseInt(formData.participants) *
                            Number.parseInt(getServicePrice(formData.service).replace("$", ""))}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-medium mb-2">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{formData.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{formData.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{formData.phone || "Not provided"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Back to Form
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitBooking}
                      disabled={isSubmitting}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white shadow transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        "Processing..."
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Proceed to Payment
                        </>
                      )}
                    </button>
                  </div>

                  {paymentError && (
                    <div className="p-4 rounded-md bg-red-50 text-red-700 border border-red-200 mt-4">
                      {paymentError}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              className="max-w-2xl mx-auto text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-4">Processing Payment</h2>
                <p className="text-gray-500 mb-6">Please wait while we redirect you to our secure payment page...</p>

                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>

                {paymentError && (
                  <div className="p-4 rounded-md bg-red-50 text-red-700 border border-red-200 mt-6">
                    {paymentError}
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Testimonials Section (optional) */}
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
