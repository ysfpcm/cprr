"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Calendar, CheckCircle, Mail } from "lucide-react"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"

// Create a client component that uses useSearchParams
function BookingConfirmation() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Safe check for browser environment before using localStorage
    if (typeof window === 'undefined') {
      console.log("Running on server, skipping localStorage operations");
      return;
    }
    
    const sendConfirmationEmail = async () => {
      setIsLoading(true);
      
      // Only attempt to process if we have a session ID
      if (!sessionId) {
        console.log("No session ID found in URL");
        setError("Missing session information. Please contact customer support if you need assistance.");
        setIsLoading(false);
        return;
      }
      
      console.log("Session ID from URL:", sessionId);
      const email = searchParams.get("email") || "";
      
      try {
        let bookingData = null;
        
        // First, try to get booking data from localStorage
        try {
          const storedBookingData = localStorage.getItem("pendingBooking");
          if (storedBookingData) {
            bookingData = JSON.parse(storedBookingData);
            console.log("Using booking data from localStorage:", bookingData);
          }
        } catch (storageError) {
          console.warn("Error accessing localStorage:", storageError);
          // Continue without localStorage data - we'll use the URL params instead
        }
        
        // If no booking data from localStorage, use the URL params as fallback
        if (!bookingData) {
          console.log("No valid booking data from localStorage, using URL params");
          bookingData = { 
            email: email,
            sessionId: sessionId 
          };
        }
        
        // If we still don't have an email, show an error
        if (!email && !bookingData.email) {
          setError("Missing contact information. Please contact customer support for assistance.");
          setIsLoading(false);
          return;
        }
        
        // Ensure we have an email (prefer localStorage data, but fallback to URL param)
        if (!bookingData.email && email) {
          bookingData.email = email;
        }
        
        // Send booking data to SimplyBook.me via our API
        try {
          console.log("Sending booking data to SimplyBook.me via API");
          const mapServiceNameToSimplybookId = (serviceName: string): number => {
            // Map service names to SimplyBookMe event IDs
            const serviceMap: Record<string, number> = {
              "BLS for Healthcare Providers (American Heart Association Compliant)": 2,
              "CPR & First Aid Certification": 3,
              "First Aid Certification": 4,
              "Babysitter Course (two‑day program)": 6,
              "Advanced Cardiac Life Support (ACLS)": 8,
              "Pediatric Advanced Life Support (PALS)": 9,
              "Test Payment (DELETE LATER)": 7,
            };

            // Try to find a match
            for (const [name, id] of Object.entries(serviceMap)) {
              if (serviceName.includes(name) || name.includes(serviceName)) {
                return id;
              }
            }
            
            // Default to 1 if no match found
            return 1;
          };

          const bookingApiResponse = await fetch("/api/bookings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              clientName: bookingData.name || "Valued Customer",
              email: bookingData.email,
              phone: bookingData.phone || "",
              service: bookingData.service || "CPR Training",
              participants: parseInt(bookingData.participants || "1", 10),
              date: bookingData.date,
              time: bookingData.time || "12:00 PM",
              unitId: bookingData.unitId,
              status: "upcoming",
              notes: `Booking confirmed via payment page.`,
              sessionId: sessionId,
              // Use simplybookEventId from the bookingData if available, otherwise map from service name
              simplybookEventId: bookingData.simplybookEventId || mapServiceNameToSimplybookId(bookingData.service || "CPR Training")
            }),
          });
          
          if (bookingApiResponse.ok) {
            const result = await bookingApiResponse.json();
            console.log("SimplyBook.me integration result:", result);
            
            // Set state to indicate booking was confirmed
            setEmailSent(true);
            
            // Clear the pending booking data
            try {
              localStorage.removeItem("pendingBooking");
            } catch (e) {
              console.warn("Could not clear localStorage:", e);
            }
          } else {
            console.error("Failed to send booking to SimplyBook.me:", await bookingApiResponse.text());
            setError("There was a problem confirming your booking. Please contact us for assistance.");
          }
        } catch (bookingError) {
          console.error("Error sending booking to SimplyBook.me:", bookingError);
          setError("An unexpected error occurred. Please contact us to confirm your booking.");
        }
      } catch (error) {
        console.error("Error processing booking confirmation:", error);
        setError("An unexpected error occurred. Please contact us to confirm your booking.");
      } finally {
        setIsLoading(false);
      }
    };
    
    sendConfirmationEmail();
  }, [sessionId, searchParams]);

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
              {isLoading ? (
                <p className="text-gray-500 mt-2">Processing your booking...</p>
              ) : (
                <p className="text-gray-500 mt-2">
                  {emailSent 
                    ? "Your booking is confirmed. You'll receive a confirmation email from Anytime CPR Health Services with all the details."
                    : "Your booking is being processed. You should receive a confirmation email shortly."}
                </p>
              )}
              {error && (
                <p className="text-red-500 mt-2">
                  {error}
                </p>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">What&apos;s Next?</h3>
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
                      <span>No prior experience is necessary - we will teach you everything you need to know</span>
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
                    <a href="mailto:info@anytimecprhealthservices.com" className="text-green-600 hover:text-green-800">
                      info@anytimecprhealthservices.com
                    </a>{" "}
                    or call at{" "}
                    <a href="tel:+13463420079" className="text-green-600 hover:text-green-800">
                      (346) 342-0079
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

// Export the page component with Suspense boundary
export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading confirmation details...</div>}>
      <BookingConfirmation />
    </Suspense>
  )
}

