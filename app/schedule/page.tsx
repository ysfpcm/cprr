"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Check, CreditCard, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"

// Updated service type definition
type Service = {
  id: string;
  name: string;
  price: string;
  description: string;
  simplybookId: number;
  availableFrom?: string; // Optional property for services that have a future availability date
}

export default function SchedulePage() {
  // --- State ---
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [showCalendar, setShowCalendar] = useState(false)
  const [step, setStep] = useState(1) // Step 1: Form, Step 2: Review, Step 3: Processing
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isLoadingSlots,] = useState<boolean>(false); // Add loading state for time slots
  const [isShaking, setIsShaking] = useState(false); // Add state for shaking
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    participants: "1",
    service: "",
    time: "",
  })

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    participants?: string;
    date?: string;
    service?: string;
    time?: string;
  }>({})

  const availableTimeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"]

  const services: Service[] = [
    {
      id: "bls",
      name: "BLS for Healthcare Providers (American Heart Association Compliant)",
      price: "$75 per person",
      description: "Basic Life Support for healthcare professionals; high‑quality CPR, airway & team‑based skills.",
      simplybookId: 2
    },
    {
      id: "cpr-first-aid",
      name: "CPR & First Aid Certification",
      price: "$110 per person",
      description: "Combined CPR (Adult/Child/Infant/AED) & First Aid. Two‑year certification.",
      simplybookId: 3
    },
    {
      id: "first-aid",
      name: "First Aid Certification",
      price: "$95 per person",
      description: "Covers bleeding, burns, fractures, scene safety & emergency action steps. Two‑year certification.",
      simplybookId: 4
    },
    {
      id: "babysitter",
      name: "Babysitter Course (two‑day program)",
      price: "$165 total",
      description: "Two‑day babysitter training — lunch & snacks provided — includes Child/Infant CPR & First Aid certification cards.",
      simplybookId: 5
    },
    {
      id: "acls",
      name: "Advanced Cardiac Life Support (ACLS)",
      price: "$145 per person",
      description: "Advanced resuscitation for healthcare providers: medications, airway management & defibrillation; builds on BLS skills.",
      simplybookId: 6,
      availableFrom: "2025-07-14"
    },
    {
      id: "pals",
      name: "Pediatric Advanced Life Support (PALS)",
      price: "$145 per person",
      description: "Advanced pediatric emergency care: assessment, rhythms, interventions & pediatric medication administration.",
      simplybookId: 7,
      availableFrom: "2025-07-14"
    },
    {
      id: "test",
      name: "Test Payment",
      price: "$0.50 per person",
      description: "For testing payment integration only.",
      simplybookId: 8
    },
  ]

  // --- Handle service selection from query params ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const serviceParam = params.get("service")
    if (serviceParam) {
      const serviceMap: { [key: string]: string } = {
        "cpr-first-aid-certification": "cpr-first-aid",
        "bls-certification": "bls",
        "first-aid-certification": "first-aid",
        "babysitter-course": "babysitter",
      }
      const serviceId = serviceMap[serviceParam]
      if (serviceId) {
        setFormData((prev) => ({ ...prev, service: serviceId }))
      }
    }
  }, [])

  // --- Form Handlers ---
  
  // Helper to format phone number input as (XXX) XXX-XXXX
  const formatPhoneNumberInput = (value: string): string => {
    if (!value) return value;

    // Remove all non-digit characters
    const phoneNumber = value.replace(/[^\d]/g, '');

    // Get length of digits
    const phoneNumberLength = phoneNumber.length;

    // Return the formatted number
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    // Limit to 10 digits for standard US/CA format
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === "phone") {
      const formattedPhoneNumber = formatPhoneNumberInput(value);
      setFormData((prev) => ({ ...prev, [name]: formattedPhoneNumber }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
        setDate(selectedDate);
        setErrors((prev) => ({ ...prev, date: undefined }));
        setShowCalendar(false); // Hide calendar on selection
    } else {
        setDate(undefined);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset shake state on new submission attempt
    setIsShaking(false);

    // Validate form
    const newErrors: {
      name?: string; // Added validation for required fields
      email?: string;
      phone?: string;
      participants?: string;
      date?: string;
      service?: string;
      time?: string;
    } = {};

    // Check all required fields
    if (!formData.name) newErrors.name = "Please enter your full name";
    if (!formData.email) newErrors.email = "Please enter your email address";
    // Basic email format check (optional but good practice)
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Please enter a valid email address";
    if (!formData.phone) newErrors.phone = "Please enter your phone number";
    if (!formData.participants || parseInt(formData.participants) <= 0) newErrors.participants = "Please enter a valid number of participants";


    if (!date) {
      newErrors.date = "Please select a date";
    }
    if (!formData.service) {
      newErrors.service = "Please select a service";
    }
    if (!formData.time) {
      newErrors.time = "Please select a time";
    }

    setErrors(newErrors); // Update errors state regardless

    if (Object.keys(newErrors).length > 0) {
      // Trigger shake animation
      // Use requestAnimationFrame to ensure state update is processed before animation
      requestAnimationFrame(() => {
          setIsShaking(true);
      });
      // Reset shake after animation duration (e.g., 300ms)
      setTimeout(() => setIsShaking(false), 300);
      return;
    }

    // If validation passes, clear errors and move to Review Step
    // setErrors({}); // Errors are already updated above
    setStep(2);
  };

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
        case "cpr-first-aid":
          amount = 11000 * participants // $110.00
          break
        case "first-aid":
          amount = 9500 * participants // $95.00
          break
        case "bls":
          amount = 7500 * participants // Updated Price: $75.00
          break
        case "babysitter":
          amount = 16500 // Updated Price: $165.00 total (not per participant)
          break
        case "acls": // Added ACLS
          amount = 14500 * participants // $145.00
          break
        case "pals": // Added PALS
          amount = 14500 * participants // $145.00
          break
        case "test":
          amount = 50 * participants // $0.50
          break
        default:
          // Set a reasonable default or throw an error if service is unknown
          console.warn(`Unknown service selected: ${formData.service}. Setting default amount.`)
          amount = 9500 * participants // Example default
      }

      // Save booking details to localStorage before redirecting
      const selectedService = services.find(s => s.id === formData.service);

      const bookingData = {
        email: formData.email,
        customerEmail: formData.email,
        name: formData.name,
        customerName: formData.name,
        service: selectedService?.name || "",
        date: date ? format(date, 'MMMM d, yyyy') : '',
        time: formData.time,
        participants: formData.participants,
        phone: formData.phone,
        unitId: 3, // Hardcode unitId to 3 (Dr. Dawn Mcclain)
        simplybookEventId: selectedService?.simplybookId // Add the SimplyBookMe event ID
      }
      
      // Save to localStorage for retrieval after payment with error handling
      try {
        localStorage.setItem('pendingBooking', JSON.stringify(bookingData))
        console.log('Saved booking data to localStorage:', bookingData)
      } catch (storageError) {
        // Log but continue - we'll use URL params as fallback
        console.error('Failed to save to localStorage:', storageError)
      }

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          service: services.find(s => s.id === formData.service)?.name || "",
          date: date ? format(date, 'MMMM d, yyyy') : '',
          time: formData.time,
          participants: formData.participants,
          customerEmail: formData.email,
          customerName: formData.name,
          phone: formData.phone,
          unitId: 3, // Hardcode unitId to 3 (Dr. Dawn Mcclain)
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
        <div className="container px-4 md:px-6 mx-auto">
          {step === 1 && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Service List */}
              <div className="flex flex-col lg:max-w-2xl">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold tracking-tighter">Book Your Session</h2>
                  <p className="text-gray-500 mt-2">Select your preferred date, time, and training service.</p>
                </div>

                <motion.div
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="text-xl font-bold mb-2">Available Services</h3>
                  <p className="text-sm text-gray-500 mb-4">Choose the training you need</p>
                  <div className="space-y-4">
                    {services.map((service) => {
                      // Check if service has an availableFrom date and if it's in the future
                      const availableFrom = service.availableFrom ? new Date(service.availableFrom) : null;
                      const currentDate = new Date();
                      const isAvailable = !availableFrom || currentDate >= availableFrom;
                      
                      // If not available, format the date for display
                      const formattedAvailableDate = availableFrom 
                        ? format(availableFrom, "MMMM d, yyyy") 
                        : "";

                      // For unavailable services, we'll apply a different style and make them unclickable
                      if (!isAvailable) {
                        return (
                          <div
                            key={service.id}
                            className="flex items-start space-x-3 p-4 border border-gray-300 rounded-lg bg-gray-100 opacity-70 relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-10">
                              <div className="bg-yellow-100 text-yellow-800 font-medium px-4 py-2 rounded-lg shadow-sm">
                                Available from {formattedAvailableDate}
                              </div>
                            </div>
                            
                            <input
                              type="radio"
                              id={service.id}
                              name="service"
                              value={service.id}
                              disabled={true}
                              className="h-4 w-4 text-gray-400 border-gray-300 mt-1 flex-shrink-0 opacity-50"
                            />
                            <label htmlFor={service.id} className="flex-1 opacity-60">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-500">{service.name}</span>
                                <span className="text-sm text-gray-500 font-medium ml-2">{service.price}</span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                            </label>
                          </div>
                        );
                      }
                      
                      // For available services, render normally
                      return (
                        <div
                          key={service.id}
                          className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="radio"
                            id={service.id}
                            name="service"
                            value={service.id}
                            checked={formData.service === service.id}
                            onChange={handleChange}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 mt-1 flex-shrink-0"
                          />
                          <label htmlFor={service.id} className="flex-1 cursor-pointer">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-gray-800">{service.name}</span>
                              <span className="text-sm text-gray-700 font-medium ml-2">{service.price}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  {errors.service && <p className="mt-2 text-sm text-red-600">{errors.service}</p>}
                  <p className="text-sm text-gray-500 mt-6">
                    Group discounts available for 5+ participants. Contact us for corporate rates.
                  </p>
                </motion.div>
              </div>

              {/* Form */}
              <div className="flex flex-col">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold tracking-tighter">Enter Your Details</h2>
                  <p className="text-gray-500 mt-2">Please provide your contact and booking information.</p>
                </div>
                
                <motion.form
                  onSubmit={handleSubmitForm}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Name Input with Error */}
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
                      className={`w-full rounded-md border ${errors.name ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.name ? 'focus:ring-red-500' : 'focus:ring-hospitality-500'} focus:border-transparent`}
                    />
                    {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                  </div>

                  {/* Email Input with Error */}
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
                      className={`w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.email ? 'focus:ring-red-500' : 'focus:ring-hospitality-500'} focus:border-transparent`}
                    />
                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                  </div>

                  {/* Phone Input with Error */}
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(123) 456-7890"
                      required
                      value={formData.phone}
                      onChange={handleChange} // Uses formatPhoneNumberInput from handleChange
                      className={`w-full rounded-md border ${errors.phone ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.phone ? 'focus:ring-red-500' : 'focus:ring-hospitality-500'} focus:border-transparent`}
                    />
                    {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
                  </div>

                  {/* Participants Input with Error */}
                  <div className="space-y-2">
                    <label htmlFor="participants" className="text-sm font-medium">
                      Number of Participants
                    </label>
                    <input
                      id="participants"
                      name="participants"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={formData.participants}
                      onChange={handleChange}
                      className={`w-full rounded-md border ${errors.participants ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.participants ? 'focus:ring-red-500' : 'focus:ring-hospitality-500'} focus:border-transparent`}
                    />
                    {errors.participants && <p className="text-sm text-red-600">{errors.participants}</p>}
                  </div>

                  {/* Calendar and Time Slots */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Calendar with Error - Now wrapped for dropdown behavior */}
                    <div className="space-y-2 relative"> {/* Added relative positioning */}                    <label className="text-sm font-medium block mb-1">Select Date</label>
                      {/* Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setShowCalendar(!showCalendar)}
                        className={`w-full flex justify-start items-center rounded-md border ${errors.date ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${errors.date ? 'focus:ring-red-500' : 'focus:ring-hospitality-500'} focus:border-transparent`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" /> {/* Use the lucide icon */}
                        {date ? format(date, "MMMM d, yyyy") : <span className="text-gray-500">Pick a date</span>}
                      </button>
                      {/* Conditionally Rendered DayPicker */}
                      {showCalendar && (
                        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-300"> {/* Positioning wrapper - Added w-full back */}
                          <DayPicker 
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            className="p-3" 
                            classNames={{
                              root: `bg-white`,
                              caption: `flex justify-center items-center py-2 mb-2 relative`,
                              caption_label: `text-sm font-medium text-gray-900`,
                              nav: `flex items-center space-x-1`,
                              nav_button: `h-7 w-7 bg-transparent p-1 hover:bg-gray-100 rounded-md`,
                              nav_button_previous: `absolute left-1`,
                              nav_button_next: `absolute right-1`,
                              table: `w-full border-collapse`,
                              head_row: `text-xs font-medium text-gray-500`,
                              head_cell: `text-center py-1`,
                              row: `mt-1`,
                              cell: `text-center p-0 relative text-sm`,
                              day: `h-8 w-8 mx-auto font-normal p-0 rounded-md aria-selected:opacity-100 hover:bg-gray-100 transition-colors`,
                              day_today: `font-bold text-red-600`,
                              day_selected: `bg-red-600 text-white hover:bg-red-700 focus:bg-red-700 rounded-md`,
                              day_outside: `text-gray-400 opacity-50`,
                              day_disabled: `text-gray-400 opacity-50 cursor-not-allowed`,
                            }}
                            disabled={(currentDate: Date) =>
                               currentDate < new Date(new Date().setDate(new Date().getDate() - 1))
                            }
                          />
                        </div>
                      )}
                      {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
                    </div>

                    {/* Time Slots with Error */}
                    <div className="space-y-2">
                      <label htmlFor="time" className="text-sm font-medium">
                        Select Time
                      </label>
                      <select
                        id="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        disabled={!date || availableTimeSlots.length === 0} // Disable if no date or no slots
                        className={`w-full rounded-md border ${errors.time ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.time ? 'focus:ring-red-500' : 'focus:ring-hospitality-500'} focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed`}
                      >
                        <option value="">Select a time slot</option>
                        {isLoadingSlots ? (
                            <option value="">Loading times...</option>
                        ) : availableTimeSlots.length > 0 ? (
                              availableTimeSlots.map((time) => (
                                  <option key={time} value={time}>
                                  {time}
                                  </option>
                              ))
                        ) : (
                            <option value="">No times available for selected date</option>
                        )}
                      </select>
                      {errors.time && <p className="text-sm text-red-600">{errors.time}</p>}
                    </div>
                  </div>

                  {/* Continue Button with Animation */}
                  <motion.button
                    type="submit"
                    className="w-full inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white shadow transition-colors hover:bg-red-700 disabled:opacity-50"
                    animate={isShaking ? { x: [0, -5, 5, -5, 5, 0] } : { x: 0 }} // Shake effect
                    transition={isShaking ? { duration: 0.3 } : {}} // Animation duration
                  >
                    Continue to Review
                  </motion.button>

                  <p className="text-sm text-gray-500 text-center">
                    By booking, you agree to our cancellation policy. Cancellations must be made at least 24 hours in advance.
                  </p>
                </motion.form>
              </div>
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
                        <p className="font-medium">{services.find(s => s.id === formData.service)?.name || "Unknown Service"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="font-medium">{services.find(s => s.id === formData.service)?.price || "$95 per person"}</p>
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
                          ${(() => {
                            // Get the selected service details
                            const selectedService = services.find(s => s.id === formData.service);
                            // Extract the price string, default to '0' if not found
                            const priceString = selectedService?.price || '0';
                             // Remove '$' and any text after the number (like ' per person') using regex
                            const priceValueString = priceString.replace(/[^\d.]/g, ''); // Keep only digits and decimal point
                            // Parse the participants count, default to 1 if invalid or zero
                            const participantsCount = Number.parseInt(formData.participants) || 1;
                            // Parse the price per person, default to 0 if invalid
                            const pricePerPerson = Number.parseFloat(priceValueString) || 0;
                            // Calculate total
                            const total = participantsCount * pricePerPerson;
                            // Format to 2 decimal places
                            return total.toFixed(2);
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Instructor</p>
                        <p className="font-medium">Dr. Dawn Mcclain</p>
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
                        <p className="font-medium">{formData.phone}</p>
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
                      <p className="text-sm text-gray-500">
                        &quot;The CPR training was excellent. The instructor was knowledgeable and made the material easy to understand. I feel confident in my ability to respond in an emergency.&quot;
                      </p>
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
