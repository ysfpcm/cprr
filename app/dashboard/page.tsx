"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, Edit, Search, X } from "lucide-react"
import { format, addDays } from "date-fns"
import { Booking, BookingStatus, getInitialBookings } from "../lib/bookings"
import { useRouter } from "next/navigation"

// Define types for status filtering
type FilterStatus = "all" | BookingStatus;

// Generate 24-hour time slots for rescheduling
const generate24HourTimeSlots = () => {
  const slots = []
  for (let hour = 0; hour < 24; hour++) {
    const time = new Date()
    time.setHours(hour, 0, 0, 0)
    slots.push(time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }))
  }
  return slots
}

const timeSlots: string[] = generate24HourTimeSlots()

// Admin emails that are allowed to access the dashboard
const ADMIN_EMAILS = ["marlx0879@gmail.com", "info@anytimecpr.com"]

export default function DashboardPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>(() => getInitialBookings())
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>(() => getInitialBookings())
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false)
  const [newDate, setNewDate] = useState<Date | null>(null)
  const [newTime, setNewTime] = useState<string>("")
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authorized to view this page
    const checkAuth = () => {
      const adminVerified = sessionStorage.getItem("admin_verified") === "true"
      const adminEmail = sessionStorage.getItem("admin_email")
      
      if (adminVerified && adminEmail && ADMIN_EMAILS.includes(adminEmail)) {
        setIsAuthorized(true)
      } else {
        // Redirect to login if not authorized
        router.push("/login")
      }
      setIsLoading(false)
    }
    
    checkAuth()
  }, [router])

  // Fetch bookings from the API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // Only fetch if authorized
        if (!isAuthorized) return;
        
        const response = await fetch('/api/bookings');
        
        if (!response.ok) {
          throw new Error(`Error fetching bookings: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.bookings) {
          // If there are no bookings from API but we have local ones, use local ones
          if (data.bookings.length === 0) {
            const localBookings = getInitialBookings();
            if (localBookings.length > 0) {
              setBookings(localBookings);
              setFilteredBookings(localBookings);
              console.log(`Using ${localBookings.length} bookings from local storage`);
            } else {
              setBookings([]);
              setFilteredBookings([]);
              console.log('No bookings found in API or local storage');
            }
          } else {
            // Use bookings from API
            setBookings(data.bookings);
            setFilteredBookings(data.bookings);
            console.log(`Loaded ${data.bookings.length} bookings from API`);
          }
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        // Fallback to local bookings if API fails
        const localBookings = getInitialBookings();
        setBookings(localBookings);
        setFilteredBookings(localBookings);
        console.log(`Fallback: Using ${localBookings.length} bookings from local storage due to API error`);
      }
    };
    
    if (!isLoading) {
      fetchBookings();
    }
  }, [isAuthorized, isLoading]);

  // Filter bookings based on search term and status
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    filterBookings(term, statusFilter)
  }

  const handleStatusFilter = (status: FilterStatus) => {
    setStatusFilter(status)
    filterBookings(searchTerm, status)
  }

  const filterBookings = (term: string, status: FilterStatus) => {
    let filtered: Booking[] = bookings

    // Filter by search term
    if (term) {
      const lowercaseTerm = term.toLowerCase()
      filtered = filtered.filter(
        (booking) =>
          booking.clientName.toLowerCase().includes(lowercaseTerm) ||
          booking.email.toLowerCase().includes(lowercaseTerm) ||
          booking.service.toLowerCase().includes(lowercaseTerm),
      )
    }

    // Filter by status
    if (status !== "all") {
      filtered = filtered.filter((booking) => booking.status === status)
    }

    setFilteredBookings(filtered)
  }

  // Handle booking actions
  const handleReschedule = (booking: Booking) => {
    setSelectedBooking(booking)
    setNewDate(new Date(booking.date))
    setNewTime(booking.time)
    setIsRescheduling(true)
  }

  const confirmReschedule = () => {
    if (!selectedBooking || !newDate || !newTime) return

    const updatedBookings = bookings.map((booking) => {
      if (booking.id === selectedBooking.id) {
        return {
          ...booking,
          date: newDate.toISOString(),
          time: newTime,
          status: "upcoming" as BookingStatus,
        }
      }
      return booking
    })

    setBookings(updatedBookings)
    setFilteredBookings(updatedBookings.filter(b => {
        const termMatch = !searchTerm ||
            b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.service.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = statusFilter === 'all' || b.status === statusFilter;
        return termMatch && statusMatch;
    }))
    setIsRescheduling(false)
    setSelectedBooking(null)
    setNewDate(null)
    setNewTime("")
  }

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    setError(null); // Clear previous errors
    try {
      // First find the booking to get its details
      const booking = bookings.find(b => b.id === bookingId);
      
      if (!booking) {
        throw new Error(`Booking with ID ${bookingId} not found in local state.`);
      }

      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // Pass all booking information in headers so server can add it if needed
          'x-client-name': booking.clientName,
          'x-client-email': booking.email,
          'x-client-phone': booking.phone,
          'x-service-name': booking.service,
          'x-participants': booking.participants.toString(),
          'x-booking-date': booking.date,
          'x-booking-time': booking.time,
          'x-notes': booking.notes || '',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update status: ${response.statusText}`);
      }

      await response.json(); // We read the response but don't use it directly

      // Update local state only after successful API call
      const updatedBookings = bookings.map((b) =>
        b.id === bookingId ? { ...b, status } : b
      );
      setBookings(updatedBookings);

      // Re-apply filters to the updated list
      filterBookings(searchTerm, statusFilter); // Use the existing filter function

      return true; // Indicate success

    } catch (err: unknown) {
      const error = err as Error;
      console.error(`Error updating booking ${bookingId} to ${status}:`, error);
      setError(`Failed to update booking: ${error.message}`);
      return false; // Indicate failure
    }
  };

  const handleCancel = async (booking: Booking) => {
    if (window.confirm(`Are you sure you want to cancel the booking for ${booking.clientName}?`)) {
      await updateBookingStatus(booking.id, "canceled");
      // The state update is now handled within updateBookingStatus after API success
    }
  };

  const handleComplete = async (booking: Booking) => {
     await updateBookingStatus(booking.id, "completed");
     // The state update is now handled within updateBookingStatus after API success
  };

  // Helper function for status badge styling
  const getStatusBadgeClass = (status: BookingStatus): string => {
    switch (status) {
      case "upcoming":
        return "bg-hospitality-100 text-hospitality-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "canceled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  // Show unauthorized message if not allowed
  if (!isAuthorized) {
    return null; // We'll redirect in the useEffect
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Gradient */}
      <section className="w-full py-12 md:py-16 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            className="flex flex-col items-center space-y-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-white">Booking Management</h1>
              <p className="mx-auto max-w-[700px] text-white/90">
                View and manage all client bookings and appointments
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="w-full py-12 bg-gradient-to-b from-gray-50 to-gray-100 flex-grow">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          {/* Search and Filter */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by client name, email, or service..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-hospitality-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value as FilterStatus)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hospitality-500"
                >
                  <option value="all">All Bookings</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Client
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Service
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date & Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Participants
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">{booking.clientName}</div>
                            <div className="text-sm text-gray-500">{booking.email}</div>
                            <div className="text-sm text-gray-500">{booking.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{booking.service}</div>
                          {booking.notes && <div className="text-xs text-gray-500 mt-1">{booking.notes}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{format(new Date(booking.date), "MMMM d, yyyy")}</div>
                          <div className="text-sm text-gray-500">{booking.time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {booking.participants} {booking.participants === 1 ? "person" : "people"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}
                          >
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {booking.status === "upcoming" && (
                              <>
                                <button
                                  onClick={() => handleReschedule(booking)}
                                  className="text-hospitality-600 hover:text-hospitality-900"
                                  title="Reschedule"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleComplete(booking)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Mark as Completed"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleCancel(booking)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Cancel Booking"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {booking.status === "canceled" && (
                              <button
                                onClick={() => handleReschedule(booking)}
                                className="text-hospitality-600 hover:text-hospitality-900"
                                title="Reschedule"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No bookings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Booking Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upcoming Bookings</h3>
              <div className="text-3xl font-bold text-hospitality-600">
                {bookings.filter((b) => b.status === "upcoming").length}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Next:{" "}
                {bookings
                  .filter((b) => b.status === "upcoming")
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
                  ?.clientName || "None"}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Completed This Week</h3>
              <div className="text-3xl font-bold text-green-600">
                {bookings.filter((b) => b.status === "completed" && new Date(b.date) > addDays(new Date(), -7)).length}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Total participants:{" "}
                {bookings
                  .filter((b) => b.status === "completed" && new Date(b.date) > addDays(new Date(), -7))
                  .reduce((sum, b) => sum + b.participants, 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Cancellations</h3>
              <div className="text-3xl font-bold text-red-600">
                {bookings.filter((b) => b.status === "canceled").length}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {((bookings.filter((b) => b.status === "canceled").length / bookings.length) * 100).toFixed(1)}% of
                total bookings
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Reschedule Modal */}
      {isRescheduling && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Reschedule Appointment</h3>
              <p className="text-sm text-gray-500 mb-4">
                Client: <span className="font-medium text-gray-900">{selectedBooking.clientName}</span>
                <br />
                Service: <span className="font-medium text-gray-900">{selectedBooking.service}</span>
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select New Date</label>
                <input
                  type="date"
                  value={newDate ? format(newDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => {
                    // Handle potential invalid date string from input
                    const dateValue = e.target.value;
                    try {
                      // Add time zone offset to avoid off-by-one day issues
                      const date = new Date(dateValue + 'T00:00:00');
                      if (!isNaN(date.getTime())) {
                        setNewDate(date);
                      } else {
                        setNewDate(null); // Handle invalid date input
                      }
                    } catch (error) {
                      console.error("Error parsing date:", error);
                      setNewDate(null);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hospitality-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select New Time</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-hospitality-500"
                >
                  <option value="">Select a time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsRescheduling(false)
                    setSelectedBooking(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReschedule}
                  disabled={!newDate || !newTime}
                  className="px-4 py-2 bg-hospitality-600 rounded-md text-sm font-medium text-white hover:bg-hospitality-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add error display element */}
       {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
          <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

