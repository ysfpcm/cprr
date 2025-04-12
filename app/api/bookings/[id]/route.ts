import { NextResponse } from 'next/server';
import type { Booking, BookingStatus } from '../../../lib/bookings'; // Adjust path as needed

// Declare global type for storing bookings if not already done project-wide
declare global {
  var bookings: Booking[];
}

// Ensure global.bookings is initialized if it doesn't exist
if (!global.bookings) {
  global.bookings = [];
  console.log("Initialized global bookings array in PATCH route.");
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
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

  } catch (error: any) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Failed to update booking status', details: error.message },
      { status: 500 }
    );
  }
}

// Optionally, add a GET handler for fetching a single booking if needed later
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    try {
      const bookingId = params.id;
      if (!bookingId) {
        return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
      }

      const booking = global.bookings.find(b => b.id === bookingId);

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      return NextResponse.json(booking);
    } catch (error: any) {
        console.error('Error fetching single booking:', error);
        return NextResponse.json(
            { error: 'Failed to fetch booking', details: error.message },
            { status: 500 }
        );
    }
} 