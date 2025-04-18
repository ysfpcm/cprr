// import { format, parseISO } from 'date-fns'; // Removed unused imports

// Define the Booking interface
export interface Booking {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  service: string;
  participants: number;
  date: string; // ISO string format
  time: string;
  status: "upcoming" | "completed" | "canceled";
  notes: string;
  sessionId?: string | null; // Add sessionId field to track Stripe payments
}

// Define types for status filtering
export type BookingStatus = Booking["status"];

// Mock data for client bookings - This would eventually be replaced by API calls
const mockBookings: Booking[] = []

// Function to save a new booking to localStorage
export const saveBooking = (bookingData: Omit<Booking, "id">): Booking => {
  try {
    // Generate a unique ID for the booking
    const id = `b${Date.now()}`;
    
    // Create the booking object
    const newBooking: Booking = {
      id,
      ...bookingData
    };
    
    // Get existing bookings from localStorage
    let existingBookings: Booking[] = [];
    try {
      const storedBookings = localStorage.getItem("bookings");
      if (storedBookings) {
        existingBookings = JSON.parse(storedBookings);
      }
    } catch (error) {
      console.error("Failed to parse existing bookings:", error);
    }
    
    // Add the new booking to the array
    const updatedBookings = [...existingBookings, newBooking];
    
    // Save back to localStorage
    localStorage.setItem("bookings", JSON.stringify(updatedBookings));
    
    return newBooking;
  } catch (error) {
    console.error("Error saving booking:", error);
    throw error;
  }
};

// Function to get initial bookings from localStorage or fallback to mock data
export const getInitialBookings = (): Booking[] => {
    try {
      // Check for browser environment
      if (typeof window === 'undefined') {
        return mockBookings;
      }
      
      // Try to get bookings from localStorage
      const storedBookings = localStorage.getItem("bookings");
      if (storedBookings) {
        const bookings = JSON.parse(storedBookings);
        return bookings.length > 0 ? bookings : mockBookings;
      }
    } catch (error) {
      console.error("Failed to retrieve bookings:", error);
    }
    
    // Fallback to mock data
    return mockBookings;
}

// Future functions for CRUD operations could go here:
// export const addBooking = async (bookingData) => { ... }
// export const updateBooking = async (id, updateData) => { ... }
// export const deleteBooking = async (id) => { ... } 