import { NextRequest, NextResponse } from 'next/server';
import type { Booking, BookingStatus } from '../../../lib/bookings';

// Extend the global scope to store bookings.
declare global {
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

    // Initialize the global bookings array if it doesn't exist
    if (!globalThis.bookings) {
      globalThis.bookings = [];
    }

    // Find the booking in the global array
    const bookingIndex = globalThis.bookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex === -1) {
      console.log(`Booking with ID ${bookingId} not found in global storage. Adding it.`);
      
      // When booking isn't found in global storage, we'll add it
      // Note: In production, you'd want to validate this against a database
      const newBooking = {
        id: bookingId,
        clientName: request.headers.get('x-client-name') || 'Client',
        email: request.headers.get('x-client-email') || 'client@example.com',
        phone: request.headers.get('x-client-phone') || '',
        service: request.headers.get('x-service-name') || 'Service',
        participants: parseInt(request.headers.get('x-participants') || '1', 10),
        date: request.headers.get('x-booking-date') || new Date().toISOString(),
        time: request.headers.get('x-booking-time') || '9:00 AM',
        status: status as BookingStatus,
        notes: request.headers.get('x-notes') || '',
      };

      // Add the new booking to the global array
      globalThis.bookings.push(newBooking);
      console.log(`Added booking ${bookingId} with status ${status} to global storage.`);
      
      return NextResponse.json(newBooking);
    }

    // Update the existing booking
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
