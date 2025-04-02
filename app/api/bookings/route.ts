import { NextResponse } from 'next/server'
import { Booking, getInitialBookings } from '../../lib/bookings'

// Declare global type for storing bookings
declare global {
  var bookings: Booking[];
}

// This API endpoint retrieves all bookings for the admin dashboard
export async function GET() {
  try {
    // In a production environment, this would fetch from a database
    // For now, we'll use the global variable or mock data as fallback
    
    let bookings: Booking[] = [];
    
    // First try to get bookings from the global variable
    if (global.bookings && global.bookings.length > 0) {
      bookings = global.bookings;
      console.log(`Returning ${bookings.length} bookings from server memory`);
    } else {
      // If no server-side bookings, return the mock data
      bookings = getInitialBookings();
      console.log(`No server bookings found, returning ${bookings.length} mock bookings`);
    }
    
    return NextResponse.json({
      success: true,
      bookings
    });
    
  } catch (error) {
    console.error('Error retrieving bookings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve bookings', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 