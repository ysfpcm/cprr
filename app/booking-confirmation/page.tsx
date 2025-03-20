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
      
      // Only attempt to send email if we have a session ID
      if (!sessionId) {
        console.log("No session ID found in URL");
        setError("Missing session information. Please contact customer support if you need assistance.");
        setIsLoading(false);
        return;
      }
      
      console.log("Session ID from URL:", sessionId);
      
      try {
        // Get the booking data from localStorage with safe access
        let storedBookingData;
        try {
          storedBookingData = localStorage.getItem("pendingBooking");
          console.log("Retrieved raw booking data:", storedBookingData);
        } catch (storageError) {
          console.error("Error accessing localStorage:", storageError);
          setError("Unable to access booking information. Please contact customer support.");
          setIsLoading(false);
          return;
        }
        
        let bookingData = null;
        
        if (!storedBookingData) {
          console.warn("No booking data found in localStorage");
          
          // Fallback to session ID only - attempt to send a minimal confirmation
          // This helps with cases where users refresh the confirmation page or access it directly
          bookingData = { 
            email: searchParams.get("email") || "", 
            sessionId: sessionId 
          };
          
          if (!bookingData.email) {
            setError("Booking information not available. Please check your email for confirmation or contact customer support.");
            setIsLoading(false);
            return;
          }
          
          console.log("Using fallback booking data from URL params:", bookingData);
        } else {
          try {
            bookingData = JSON.parse(storedBookingData);
            console.log("Parsed booking data from localStorage:", bookingData);
          } catch (parseError) {
            console.error("Failed to parse booking data from localStorage:", parseError);
            setError("Unable to process booking information. Please contact customer support.");
            setIsLoading(false);
            return;
          }
        }
        
        // Ensure we have required email data
        if (!bookingData.email) {
          console.error("No email found in booking data");
          setError("Missing contact information. Please contact customer support.");
          setIsLoading(false);
          return;
        }
        
        // Construct a properly formatted request with required fields
        const emailRequest = {
          email: bookingData.email,
          name: bookingData.name || "Valued Customer",
          service: bookingData.service || "CPR Training",
          date: bookingData.date || "As scheduled",
          time: bookingData.time || "As scheduled",
          participants: bookingData.participants || "1",
          sessionId: sessionId // Include the session ID for reference
        };
        
        console.log("Sending email request with data:", emailRequest);
        
        // Send the confirmation email directly
        const response = await fetch("/api/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailRequest),
        });
        
        if (response.ok) {
          setEmailSent(true);
          // Clear the pending booking data
          try {
            localStorage.removeItem("pendingBooking");
          } catch (e) {
            console.warn("Could not clear localStorage:", e);
          }
          console.log("Confirmation email sent successfully to:", emailRequest.email);
        } else {
          let errorText = "";
          try {
            const errorResponse = await response.json();
            errorText = JSON.stringify(errorResponse);
          } catch {
            errorText = await response.text();
          }
          console.error("Failed to send confirmation email:", errorText);
          setError("There was a problem sending your confirmation email. Please contact us for assistance.");
        }
      } catch (error) {
        console.error("Error sending confirmation email:", error);
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
                <p className="text-gray-500 mt-2">Loading confirmation details...</p>
              ) : (
                <p className="text-gray-500 mt-2">
                  {emailSent 
                    ? "We&apos;ve sent a confirmation email with all the details. Please check your inbox."
                    : "Your booking is confirmed. You should receive a confirmation email shortly."}
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

// Export the page component with Suspense boundary
export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading confirmation details...</div>}>
      <BookingConfirmation />
    </Suspense>
  )
}

