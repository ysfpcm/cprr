import { NextResponse } from 'next/server'
import { Booking, getInitialBookings } from '../../lib/bookings'
import { format, parseISO, parse } from 'date-fns';

// Declare global type for storing bookings
declare global {
  var bookings: Booking[];
}

// Define interfaces for SimplyBook.me API responses
interface SimplybookEvent {
  name: string;
  duration: number;
  price: number;
  [key: string]: any; // For other properties we don't need to explicitly define
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

// Helper function to get SimplyBook.me auth token
async function getSimplybookToken(companyLogin: string, apiKey: string): Promise<string> {
  const loginUrl = 'https://user-api.simplybook.me/login';
  console.log("Requesting SimplyBook.me token...");
  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getToken',
        params: [companyLogin, apiKey],
        id: 'login' // Simple ID for the request
      })
    });

    if (!response.ok) {
      throw new Error(`SimplyBook.me login API request failed with status ${response.status}`);
    }

    const result = await response.json();
    if (result.error) {
      console.error("SimplyBook.me getToken Error:", result.error);
      throw new Error(`SimplyBook.me login error: ${result.error.message}`);
    }
    
    const token = result.result;
    if (!token) {
        throw new Error("SimplyBook.me login response did not include a token.");
    }
    console.log("Successfully obtained SimplyBook.me token.");
    return token;
  } catch (error) {
    console.error("Error fetching SimplyBook.me token:", error);
    throw error; // Re-throw to be caught by the main handler
  }
}

// Helper function to format phone number for SimplyBook.me
function formatPhoneNumber(phoneString: string): string { // Return string placeholder if invalid
  // Return placeholder if input is empty or undefined
  if (!phoneString || phoneString.trim() === '') {
    console.log("Empty or whitespace-only phone provided, using placeholder");
    return '+15555555555'; // Return placeholder string
  }

  // Remove all non-digit characters (including frontend formatting like parentheses, spaces, hyphens)
  const digitsOnly = phoneString.replace(/[^\d]/g, '');

  if (digitsOnly.length === 0) {
    // If after cleaning there are no digits, use placeholder
    console.log("No digits found in phone string after cleaning, using placeholder");
    return '+15555555555'; // Return placeholder string
  }

  // SimplyBook.me seems to expect a standardized format with country code
  // If the cleaned number doesn't start with +, assume US/CA and add +1
  if (digitsOnly.startsWith('1') && digitsOnly.length === 11) {
      // Already has US country code, ensure + is present
      console.log(`Formatted phone from "${phoneString}" to "+${digitsOnly}" (added +)`);
      return `+${digitsOnly}`;
  } else if (digitsOnly.length === 10) {
      // Standard 10-digit US/CA number, add +1
      console.log(`Formatted phone from "${phoneString}" to "+1${digitsOnly}" (added +1)`);
      return `+1${digitsOnly}`;
  } else if (digitsOnly.startsWith('+')) {
      // Already starts with +, assume it's correct international format
      console.log(`Formatted phone from "${phoneString}" to "${digitsOnly}" (already international)`);
      return digitsOnly; // Return as is, assuming + signifies correct format
  } else {
      // For other lengths or formats not explicitly handled, prepend + but log warning
      console.warn(`Phone "${phoneString}" has unexpected length (${digitsOnly.length}). Prepending '+' as fallback: +${digitsOnly}`);
      return `+${digitsOnly}`;
  }
}

// Helper function to format date to YYYY-MM-DD
function formatSimplybookDate(dateString: string): string | null {
    if (!dateString) return null;
    console.log(`Attempting to format date: "${dateString}"`);
    
    try {
        // Attempt to parse common formats, prioritize ISO
        let parsedDate: Date;
        
        // Special handling for "Month Day, Year" format (e.g., "April 14, 2025")
        const monthDayYearRegex = /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/;
        const monthDayYearMatch = dateString.match(monthDayYearRegex);
        
        if (monthDayYearMatch) {
            console.log("Detected 'Month Day, Year' format");
            const [_, month, day, year] = monthDayYearMatch;
            // Convert to a format that parse() can handle
            const formattedInput = `${month} ${day}, ${year}`;
            parsedDate = parse(formattedInput, 'MMMM d, yyyy', new Date());
            console.log(`Parsed date using 'MMMM d, yyyy' format: ${parsedDate.toISOString()}`);
        }
        else if (dateString.includes('T')) { // Likely ISO 8601
            console.log("Detected ISO format date");
            parsedDate = parseISO(dateString);
            console.log(`Parsed ISO date: ${parsedDate.toISOString()}`);
        } 
        else if (dateString.includes('-')) { // Likely YYYY-MM-DD
            console.log("Detected YYYY-MM-DD format");
            // If already in YYYY-MM-DD format, validate and return
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(dateString)) {
                console.log(`Date already in correct format: ${dateString}`);
                return dateString;
            }
            // Otherwise parse
            parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
        }
        else {
            // Try parsing 'MMMM d, yyyy' (format used in schedule page)
            console.log("Attempting to parse with various formats");
            try {
                parsedDate = parse(dateString, 'MMMM d, yyyy', new Date());
                console.log(`Successfully parsed with 'MMMM d, yyyy' format: ${parsedDate.toISOString()}`);
            } catch (formatError) {
                console.warn(`Could not parse date "${dateString}" with format 'MMMM d, yyyy', trying direct parse...`);
                // Fallback to direct Date parsing (less reliable)
                parsedDate = new Date(dateString);
                console.log(`Fallback Date parse result: ${parsedDate.toISOString()}`);
            }
        }
        
        if (isNaN(parsedDate.getTime())) {
            throw new Error(`Invalid date input: "${dateString}"`);
        }
        
        const result = format(parsedDate, 'yyyy-MM-dd');
        console.log(`Formatted date result: ${result}`);
        return result;
    } catch (error) {
        console.error(`Error formatting date "${dateString}":`, error);
        return null; // Indicate failure
    }
}

// Helper function to format time to HH:MM:SS (24-hour)
function formatSimplybookTime(timeString: string): string | null {
    if (!timeString) return null;
    console.log(`Attempting to format time: "${timeString}"`);
    
    try {
        // Check for common time formats
        
        // Already in 24-hour HH:MM:SS format?
        if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
            console.log(`Time already in correct HH:MM:SS format: ${timeString}`);
            return timeString;
        }
        
        // Check for "HH:MM AM/PM" format
        const timeParts = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (timeParts) {
            let hours = parseInt(timeParts[1], 10);
            const minutes = parseInt(timeParts[2], 10);
            const ampm = timeParts[3]?.toUpperCase();
            
            console.log(`Parsed time: ${hours}:${minutes} ${ampm || '(24hr)'}`);

            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0; // Midnight case

            const formattedHours = hours.toString().padStart(2, '0');
            const formattedMinutes = minutes.toString().padStart(2, '0');
            const result = `${formattedHours}:${formattedMinutes}:00`;
            
            console.log(`Formatted time result: ${result}`);
            return result;
        } else if (/^\d{1,2}:\d{2}$/.test(timeString)) {
            // Assume 24-hour format if no AM/PM e.g. '14:30'
            console.log("Detected 24-hour format without seconds");
            const [hours, minutes] = timeString.split(':');
            const result = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
            
            console.log(`Formatted time result: ${result}`);
            return result;
        }
       
        console.warn(`Could not parse time "${timeString}" into HH:MM:SS format.`);
        return null; // Indicate failure or use a default
        
    } catch (error) {
        console.error(`Error formatting time "${timeString}":`, error);
        return null;
    }
}

// Helper function to map service name to SimplyBook.me service ID
async function getSimplybookEventId(serviceName: string, companyLogin: string, token: string): Promise<number> {
  console.log(`Looking up event ID for service: "${serviceName}"`);

  try {
    // Fetch the actual event list from SimplyBook.me to get correct IDs
    const eventListResponse = await fetch('https://user-api.simplybook.me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Company-Login': companyLogin,
        'X-Token': token
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getEventList',
        params: [],
        id: 'events'
      })
    });
    
    const eventListResult = await eventListResponse.json();
    if (eventListResult.error) {
      console.error("SimplyBook.me getEventList Error:", eventListResult.error);
      throw new Error(`Failed to fetch events from SimplyBook.me: ${eventListResult.error.message}`);
    }
    
    const events: Record<string, SimplybookEvent> = eventListResult.result || {};
    console.log(`Retrieved ${Object.keys(events).length} events from SimplyBook.me`);
    
    // Try exact match first
    for (const [id, event] of Object.entries(events)) {
      if (event.name === serviceName) {
        console.log(`Found exact match for "${serviceName}" with ID ${id}`);
        return parseInt(id, 10);
      }
    }
    
    // If no exact match, try case-insensitive match
    for (const [id, event] of Object.entries(events)) {
      if (event.name.toLowerCase() === serviceName.toLowerCase()) {
        console.log(`Found case-insensitive match for "${serviceName}" with ID ${id}`);
        return parseInt(id, 10);
      }
    }
    
    // If still no match, try partial match
    for (const [id, event] of Object.entries(events)) {
      if (event.name.toLowerCase().includes(serviceName.toLowerCase()) || 
          serviceName.toLowerCase().includes(event.name.toLowerCase())) {
        console.log(`Found partial match for "${serviceName}" with event "${event.name}" (ID ${id})`);
        return parseInt(id, 10);
      }
    }
    
    // If no matches at all, get the first event as fallback (if any events exist)
    if (Object.keys(events).length > 0) {
      const firstEventId = Object.keys(events)[0];
      const firstName = events[firstEventId].name;
      console.log(`No match found for "${serviceName}". Using first available event "${firstName}" (ID ${firstEventId})`);
      return parseInt(firstEventId, 10);
    }
    
    // Final fallback if no events exist
    console.warn(`No SimplyBook.me events found. Using default ID 1 for "${serviceName}"`);
    return 1;
  } catch (error) {
    console.error("Error fetching SimplyBook.me events:", error);
    console.warn(`Using fallback event ID mapping for "${serviceName}"`);
    
    // Fallback mapping if API call fails
    const serviceMap: Record<string, number> = {
      "CPR Training": 1,
      "First Aid Course": 2,
      "AED Training": 3,
      "Basic Life Support": 4,
      "Test Payment (DELETE LATER)": 1,
    };

    const eventId = serviceMap[serviceName];
    return eventId || 1; // Return mapped ID or default (1)
  }
}

// Helper function to check if a specific time slot is available
async function checkTimeSlotAvailability(
  eventId: number, 
  date: string, 
  time: string, // Expects HH:MM:SS format
  companyLogin: string, 
  token: string
): Promise<boolean> {
    console.log(`Checking availability for event ID ${eventId} on ${date} at ${time}`);
    try {
        const response = await fetch('https://user-api.simplybook.me', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Company-Login': companyLogin,
                'X-Token': token
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'getStartTimeList', // CORRECTED METHOD NAME
                params: [eventId, null, date], // unitId is null here, might need adjustment if unit is known
                id: `check_${eventId}_${date}`
            })
        });
        
        if (!response.ok) {
            console.error(`SimplyBook.me getStartTimeList request failed with status ${response.status}`);
            return false; // Assume unavailable on failure
        }

        const result = await response.json();
        if (result.error) {
            console.error("SimplyBook.me getStartTimeList Error:", result.error);
            return false; // Assume unavailable on error
        }

        const availableSlots: Record<string, number> = result.result || {};
        // Simplybook returns time slots like "13:00:00" as keys
        const isAvailable = time in availableSlots;
        
        console.log(`Time slot ${time} on ${date} for event ${eventId} is available: ${isAvailable}`);
        console.log("Available slots found:", availableSlots);
        return isAvailable;

    } catch (error) {
        console.error("Error checking time slot availability:", error);
        return false; // Assume unavailable on exception
    }
}

// This API endpoint handles creating a new booking after successful payment
// and sends the details to simplybook.me
export async function POST(request: Request) {
  let savedBooking: Booking | null = null; // Define here to be accessible in catch/finally if needed
  let simplybookResult: any = null; // To store simplybook response

  try {
    const bookingData = await request.json();

    console.log("Received booking data:", bookingData);

    // 1. Validate incoming bookingData (Add more specific checks as needed)
    if (!bookingData.email || !bookingData.service || !bookingData.date || !bookingData.time) {
         throw new Error("Missing required booking data fields (email, service, date, time).");
    }

    // 2. Retrieve simplybook.me credentials
    const simplybookApiKey = process.env.SIMPLYBOOK_API_KEY;
    const simplybookCompanyLogin = process.env.SIMPLYBOOK_COMPANY_LOGIN;

    if (!simplybookApiKey || !simplybookCompanyLogin) {
      throw new Error("Simplybook.me API key or company login not configured in environment variables.");
    }

    // --- Simplybook.me API Call ---
    console.log("Starting SimplyBook.me integration...");
    try {
        // 3. Get Authentication Token
        const token = await getSimplybookToken(simplybookCompanyLogin, simplybookApiKey);

        // 4. Prepare data for SimplyBook.me
        // Map the service name to SimplyBook.me event ID
        const eventId = await getSimplybookEventId(bookingData.service, simplybookCompanyLogin, token);
        // Get unitId from request, default to null if not provided or invalid
        const rawUnitId = bookingData.unitId;
        let unitId: number | null = null;
        if (rawUnitId) {
            const parsedId = parseInt(String(rawUnitId), 10);
            if (!isNaN(parsedId)) {
                unitId = parsedId;
                console.log(`Using provided unitId: ${unitId}`);
            } else {
                console.warn(`Invalid unitId provided: \"${rawUnitId}\". Defaulting to null.`);
            }
        } else {
            console.log("No unitId provided, defaulting to null.");
        }
                
        console.log(`Mapped service "${bookingData.service}" to SimplyBook.me event ID: ${eventId}`);
        
        const formattedDate = formatSimplybookDate(bookingData.date);
        const formattedTime = formatSimplybookTime(bookingData.time);

        console.log(`Original date: "${bookingData.date}", formatted: "${formattedDate}"`);
        console.log(`Original time: "${bookingData.time}", formatted: "${formattedTime}"`);

        if (!formattedDate || !formattedTime) {
            throw new Error(`Failed to format date ("${bookingData.date}") or time ("${bookingData.time}") for SimplyBook.me.`);
        }
        
        // Check if the selected time slot is available before attempting to book
        const isTimeSlotAvailable = await checkTimeSlotAvailability(
          eventId, 
          formattedDate, 
          formattedTime, 
          simplybookCompanyLogin, 
          token
        );
        
        if (!isTimeSlotAvailable) {
          console.warn(`The selected time slot (${formattedDate} at ${formattedTime}) is not available for event ID ${eventId}.`);
          
          // Let's try to suggest alternative times 
          try {
            // Check the next 10 days for available slots
            const suggestions = [];
            const baseDate = new Date(formattedDate);
            
            for (let i = 1; i <= 10; i++) {
              const nextDate = new Date(baseDate);
              nextDate.setDate(baseDate.getDate() + i);
              const nextDateFormatted = nextDate.toISOString().split('T')[0];
              
              // Check if this date has slots
              const timeSlotsResponse = await fetch('https://user-api.simplybook.me', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Company-Login': simplybookCompanyLogin,
                  'X-Token': token
                },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'getStartTimeList',
                  params: [eventId, null, nextDateFormatted],
                  id: 'timeslots'
                })
              });
              
              const slots = await timeSlotsResponse.json();
              if (slots.result && slots.result.length > 0) {
                suggestions.push({
                  date: nextDateFormatted,
                  slots: slots.result.slice(0, 3) // Just get first 3 slots
                });
                
                // If we found 3 days with slots, that's enough
                if (suggestions.length >= 3) break;
              }
            }
            
            if (suggestions.length > 0) {
              console.log("Alternative time slots found:", suggestions);
              // Store these suggestions to include in the response or email
              bookingData.suggestedAlternatives = suggestions;
            } else {
              console.log("No alternative time slots found in the next 10 days.");
            }
          } catch (suggestionError) {
            console.error("Error finding alternative time slots:", suggestionError);
          }
          
          // We'll still try to make the booking as SimplyBook.me will validate on their end too
        }

        const clientPhone = formatPhoneNumber(bookingData.phone);

        const clientData = {
            name: bookingData.clientName || 'Valued Customer',
            email: bookingData.email,
            phone: clientPhone, // Use the formatted (potentially placeholder) phone number string
            // Add other client fields if required by your SimplyBook setup
        };

        const additionalData = {
            booking_notes: bookingData.notes || `Booking via website. Stripe Session: ${bookingData.sessionId || 'N/A'}`,
            // Add other additional fields if needed
        };

        // 5. Construct JSON-RPC Payload for 'book' method
        const simplybookPayload = {
          jsonrpc: '2.0',
          method: 'book',
          params: [
            eventId,
            unitId,
            formattedDate,
            formattedTime,
            clientData,
            additionalData
          ],
          id: `booking_${bookingData.sessionId || Date.now()}` // Unique ID for the request
        };
        
        console.log("Sending booking request to SimplyBook.me with payload:", JSON.stringify(simplybookPayload, null, 2));

        // 6. Make the API call to SimplyBook.me
        const simplybookApiUrl = 'https://user-api.simplybook.me';
        const simplybookResponse = await fetch(simplybookApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Company-Login': simplybookCompanyLogin,
            'X-Token': token
          },
          body: JSON.stringify(simplybookPayload)
        });

        simplybookResult = await simplybookResponse.json(); // Store result

        if (!simplybookResponse.ok || simplybookResult.error) {
          console.error("SimplyBook.me 'book' API Error Response:", simplybookResult);
          const errorMessage = simplybookResult.error?.message || `HTTP status ${simplybookResponse.status}`;
          
          // Handle specific error cases
          if (simplybookResult.error?.data?.field === 'phone') {
            console.warn("Phone number format issue detected by SimplyBook.me");
            // If this is a phone validation error, try to fix or provide guidance
            console.error(`Phone value that caused validation error: \"${clientData.phone}\" (Original input: \"${bookingData.phone}\")`);
            // This now likely means the *formatting* is wrong, or the placeholder isn't liked in some contexts.
          } else if (errorMessage === 'Selected unit id is not available') {
            console.warn("SimplyBook.me reports the selected unit ID is not available for this event/time.");
            console.warn(`Event ID: ${eventId}, Unit ID Used: ${unitId}`);
            // Log available units for the event for debugging
            try {
              const eventDetailsResponse = await fetch('https://user-api.simplybook.me', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Company-Login': simplybookCompanyLogin,
                  'X-Token': token
                },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'getEvent', // Method to get single event details
                  params: [eventId],
                  id: 'event_detail'
                })
              });
              const eventDetailsResult = await eventDetailsResponse.json();
              if (eventDetailsResult.result) {
                console.log("Details for Event ID " + eventId + ":", eventDetailsResult.result);
                console.log("Available units (unit_map):", eventDetailsResult.result.unit_map);
              } else {
                 console.log("Could not fetch event details for ID " + eventId);
              }

            } catch (eventLookupError) {
              console.error("Failed to fetch event details for debugging unit_map:", eventLookupError);
            }
          } else if (errorMessage === 'Selected event id is not available') {
            console.warn("SimplyBook.me reports the event is not available. This likely means:");
            console.warn("1. The event ID is incorrect (current ID: " + eventId + ")");
            console.warn("2. The event is not available at the selected date/time");
            console.warn("3. The event may be fully booked or closed for that date/time");
            
            // Log all available events for debugging
            try {
              const availableEvents = await fetch('https://user-api.simplybook.me', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Company-Login': simplybookCompanyLogin,
                  'X-Token': token
                },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'getEventList',
                  params: [],
                  id: 'events'
                })
              });
              
              const eventsData = await availableEvents.json();
              console.log("Available events in SimplyBook.me:", eventsData.result);
            } catch (eventLookupError) {
              console.error("Failed to fetch available events:", eventLookupError);
            }
          }
          
          // Don't throw here if you want to save internally anyway, but log prominently
          console.error(`Failed to create booking on SimplyBook.me: ${errorMessage}`);
          // Optionally: Decide if internal save should proceed despite SimplyBook failure
          // For now, we will continue to internal save but the message will reflect the issue
        } else {
           console.log("Successfully created booking on SimplyBook.me:", simplybookResult.result);
        }

    } catch (simplybookError) {
        console.error("Error during SimplyBook.me API interaction:", simplybookError);
        // Decide if this should prevent internal saving. We'll log and continue for now.
    }
    // --- End Simplybook.me API Call ---


    // --- Internal Booking Save for Dashboard ---
    // (This section remains largely the same as before)
    try {
      // Get or initialize the global bookings array
      if (!global.bookings) {
        global.bookings = [];
        console.log("Initialized global bookings array");
      }

      // Check if this is a duplicate booking using sessionId
      let existingBookingIndex = -1;
      if (bookingData.sessionId) {
        existingBookingIndex = global.bookings.findIndex(
          b => b.sessionId === bookingData.sessionId
        );
      }

      // If we found an existing booking with the same sessionId, update it
      if (existingBookingIndex >= 0) {
        console.log(`Updating existing internal booking with sessionId: ${bookingData.sessionId}`);
        global.bookings[existingBookingIndex] = {
          ...global.bookings[existingBookingIndex],
          clientName: bookingData.clientName || global.bookings[existingBookingIndex].clientName,
          email: bookingData.email || global.bookings[existingBookingIndex].email,
          phone: formatPhoneNumber(bookingData.phone), // Use formatted string (placeholder if needed)
          service: bookingData.service || global.bookings[existingBookingIndex].service,
          participants: Number(bookingData.participants) || global.bookings[existingBookingIndex].participants || 1,
          date: bookingData.date || global.bookings[existingBookingIndex].date || new Date().toISOString(),
          time: bookingData.time || global.bookings[existingBookingIndex].time || 'Scheduled',
          status: bookingData.status || 'upcoming',
          notes: bookingData.notes || global.bookings[existingBookingIndex].notes || '',
          sessionId: bookingData.sessionId
        };
        savedBooking = global.bookings[existingBookingIndex];
        console.log("Internal booking updated successfully.");

      } else {
        // Create a new booking if no existing one found
        console.log("Creating new internal booking.");
        const newBooking: Booking = {
          id: `b${Date.now()}`,
          clientName: bookingData.clientName || 'Valued Customer',
          email: bookingData.email,
          phone: formatPhoneNumber(bookingData.phone), // Use formatted string (placeholder if needed)
          service: bookingData.service || 'Unknown Service',
          participants: Number(bookingData.participants) || 1,
          date: bookingData.date || new Date().toISOString(),
          time: bookingData.time || 'Scheduled',
          status: 'upcoming',
          notes: bookingData.notes || '',
          sessionId: bookingData.sessionId || null
        };
        global.bookings.push(newBooking);
        savedBooking = newBooking;
        console.log(`Internal booking saved successfully. Total bookings: ${global.bookings.length}`);
      }
    } catch (saveError) {
        console.error("Error saving booking internally:", saveError);
        // Logged, but processing continues
    }
    // --- End Internal Booking Save ---

    // Determine overall success message based on SimplyBook result
    let message = "Booking processed and saved internally.";
    let suggestions = bookingData.suggestedAlternatives || [];
    
    if (simplybookResult?.result) {
         message = "Booking successful on SimplyBook.me and saved internally.";
    } else if (simplybookResult?.error) {
         if (simplybookResult.error.message === 'Selected event id is not available') {
           message = "Booking saved internally, but the selected service is not available for the chosen date and time on SimplyBook.me. Your appointment will be reviewed by our team.";
           
           if (suggestions && suggestions.length > 0) {
             message += " We've found some alternative times that are available.";
           }
         } else {
           message = "Booking saved internally, but failed to sync with SimplyBook.me. Please check manually.";
         }
    } else {
        // Case where simplybook call failed before getting a result (e.g., network error)
        message = "Booking saved internally, but encountered an error attempting to sync with SimplyBook.me.";
    }

    // Respond to the client (Stripe Webhook)
    return NextResponse.json({
      success: !!savedBooking, // Success based on internal save for now
      message: message,
      bookingDetails: savedBooking, // Include saved booking details in response
      simplybookResponse: simplybookResult, // Include the raw simplybook response for debugging
      alternativeTimes: suggestions.length > 0 ? suggestions : undefined // Include suggested alternatives if available
    });

  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    // Ensure response is still sent even if internal save failed before this point
    return NextResponse.json(
      { 
          error: 'Failed to process booking request', 
          details: error instanceof Error ? error.message : String(error),
          bookingDetails: savedBooking // Include saved booking if it happened before error
      },
      { status: 500 }
    );
  }
} 