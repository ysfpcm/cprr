import { NextRequest, NextResponse } from 'next/server';
import type { Booking, BookingStatus } from '../../../lib/bookings';

// Extend the global scope to store bookings. Disable eslint rule for no-var.
declare global {
  // eslint-disable-next-line no-var
  var bookings: Booking[];
}

if (!globalThis.bookings) {
  globalThis.bookings = [];
  console.log("Initialized global bookings array.");
}

// GET handler without params in signature
export async function GET(request: NextRequest) {
  try {
    // Get the booking ID from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    console.log("Minimal GET handler called for booking ID:", id);
    return NextResponse.json({ message: "GET request received", id });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in minimal GET handler:', err);
    return NextResponse.json(
      { error: 'Failed to fetch booking', details: err.message },
      { status: 500 }
    );
  }
}

// PATCH handler without params in signature
export async function PATCH(request: NextRequest) {
  try {
    // Get the booking ID from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const bookingId = pathParts[pathParts.length - 1];
    
    const { status } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }
    if (!status || !['upcoming', 'completed', 'canceled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status provided' }, { status: 400 });
    }

    console.log(`Received PATCH request for booking ID: ${bookingId}, new status: ${status}`);

    const bookingIndex = globalThis.bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) {
      console.error(`Booking with ID ${bookingId} not found.`);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    globalThis.bookings[bookingIndex].status = status as BookingStatus;
    const updatedBooking = globalThis.bookings[bookingIndex];

    console.log(`Booking ${bookingId} status updated to ${status}.`);
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
