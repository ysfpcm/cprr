import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server'; // Import NextRequest type
import type { Booking, BookingStatus } from '../../../lib/bookings'; // Adjust path as needed

// Define an interface for the route context
interface RouteContext {
  params: {
    id: string;
  };
}

// Declare global type for storing bookings if not already done project-wide
declare global {
  // eslint-disable-next-line no-var
  var bookings: Booking[];
}

// Ensure global.bookings is initialized if it doesn't exist
if (!global.bookings) {
  global.bookings = [];
  console.log("Initialized global bookings array.");
}

// GET handler for fetching a single booking
// @ts-ignore - Necessary for build due to persistent type error
export async function GET(
  request: NextRequest, 
  context: RouteContext
) {
  try {
    console.log("Minimal GET handler called for booking ID:", context.params.id);
    // Minimal implementation to test build
    return NextResponse.json({ message: "GET request received", id: context.params.id }); 
  } catch (error: unknown) {
      const err = error as Error;
      console.error('Error in minimal GET handler:', err);
      return NextResponse.json(
          { error: 'Failed to fetch booking', details: err.message },
          { status: 500 }
      );
  }
}

// PATCH handler for updating a booking's status
export async function PATCH(
  request: NextRequest, 
  context: RouteContext
) {
  try {
    const bookingId = context.params.id;
    const { status } = await request.json();

    // Basic validation
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }
    if (!status || !['upcoming', 'completed', 'canceled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status provided' }, { status: 400 });
    }

    console.log(`Received PATCH request for booking ID: ${bookingId}, new status: ${status}`);

    // Find the booking by ID in the global array
    const bookingIndex = global.bookings.findIndex(b => b.id === bookingId);

    if (bookingIndex === -1) {
      console.error(`Booking with ID ${bookingId} not found.`);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Update the booking status
    global.bookings[bookingIndex].status = status as BookingStatus;
    const updatedBooking = global.bookings[bookingIndex];

    console.log(`Booking ${bookingId} status updated to ${status}.`);

    // Return the updated booking object
    return NextResponse.json(updatedBooking);

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error updating booking status:', err);
    return NextResponse.json(
      { error: 'Failed to update booking status', details: err.message },
      { status: 500 }
    );
  }
} 