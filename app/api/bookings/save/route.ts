import { NextResponse } from 'next/server'
import { Booking } from '../../../lib/bookings'

// Declare global type for storing bookings
declare global {
  var bookings: Booking[];
}

// This API endpoint saves booking data to be displayed in the admin dashboard
export async function POST(request: Request) {
  try {
    const bookingData = await request.json()
    
    // Log the received booking data
    console.log('Received booking data:', bookingData)
    
    // Validate required fields
    if (!bookingData.email) {
      return NextResponse.json(
        { error: 'Missing required email field' },
        { status: 400 }
      )
    }
    
    // In a production environment, we would save this to a database
    // For now, we'll keep a record of bookings using server-side global variable
    // This is not persistent across server restarts but serves as a simple solution
    
    // Get or initialize the global bookings array
    if (!global.bookings) {
      global.bookings = []
    }
    
    // Check if this is a duplicate booking (using sessionId if available)
    let existingBookingIndex = -1
    
    if (bookingData.sessionId) {
      existingBookingIndex = global.bookings.findIndex(
        b => b.sessionId === bookingData.sessionId
      )
    }
    
    // If we found an existing booking with the same sessionId, update it
    if (existingBookingIndex >= 0) {
      console.log(`Updating existing booking with sessionId: ${bookingData.sessionId}`)
      
      // Update the existing booking
      global.bookings[existingBookingIndex] = {
        ...global.bookings[existingBookingIndex],
        clientName: bookingData.clientName || global.bookings[existingBookingIndex].clientName,
        email: bookingData.email || global.bookings[existingBookingIndex].email,
        phone: bookingData.phone || global.bookings[existingBookingIndex].phone,
        service: bookingData.service || global.bookings[existingBookingIndex].service,
        participants: Number(bookingData.participants) || global.bookings[existingBookingIndex].participants,
        date: bookingData.date || global.bookings[existingBookingIndex].date,
        time: bookingData.time || global.bookings[existingBookingIndex].time,
        status: bookingData.status || global.bookings[existingBookingIndex].status,
        notes: bookingData.notes || global.bookings[existingBookingIndex].notes,
      }
      
      return NextResponse.json({
        success: true,
        message: 'Booking updated successfully',
        booking: global.bookings[existingBookingIndex]
      })
    }
    
    // Create a new booking with a generated ID
    const newBooking: Booking = {
      id: `b${Date.now()}`,
      clientName: bookingData.clientName || 'Valued Customer',
      email: bookingData.email,
      phone: bookingData.phone || '',
      service: bookingData.service || 'CPR Training',
      participants: Number(bookingData.participants) || 1,
      date: bookingData.date || new Date().toISOString(),
      time: bookingData.time || '12:00 PM',
      status: bookingData.status || 'upcoming',
      notes: bookingData.notes || '',
      sessionId: bookingData.sessionId || null
    }
    
    // Add to the global bookings
    global.bookings.push(newBooking)
    
    console.log(`Booking saved successfully. Total bookings: ${global.bookings.length}`)
    
    return NextResponse.json({
      success: true,
      message: 'Booking saved successfully',
      booking: newBooking
    })
    
  } catch (error) {
    console.error('Error saving booking:', error)
    return NextResponse.json(
      { error: 'Failed to save booking data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 