import { NextResponse } from 'next/server'
import { Booking, getInitialBookings } from '../../lib/bookings'
import { format, parseISO, parse } from 'date-fns';

// Declare global type for storing bookings
declare global {
  // eslint-disable-next-line no-var
  var bookings: Booking[];
}

// Define interfaces for SimplyBook.me API responses
interface SimplybookEvent {
  name: string;
  duration: number;
  price: number;
  [key: string]: unknown; // For other properties we don't need to explicitly define
}

interface SimplybookUnit {
  name: string;
  // Add other known properties if available
  [key: string]: unknown; // For other properties we don't need to explicitly define
}

// Define interface for SimplyBook.me API response
interface SimplybookResponse {
  result?: unknown;
  error?: {
    message: string;
    data?: {
      field?: string;
    };
  };
  [key: string]: unknown;
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
            const [, month, day, year] = monthDayYearMatch;
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
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_) {
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
      "BLS for Healthcare Providers": 2,
      "CPR & First Aid Certification (AHA Guidelines)": 3,
      "First Aid Certification (AHA Guidelines)": 4,
      "Pediatric Training": 5,
      "Babysitter Course": 6,
      "Test Payment (DELETE LATER)": 7,
    };

    const eventId = serviceMap[serviceName];
    return eventId || 1; // Return mapped ID or default (1)
  }
}

// Helper function to get performers/units from SimplyBook.me
async function getSimplybookUnitList(companyLogin: string, token: string): Promise<Record<string, SimplybookUnit>> {
  console.log("Fetching performers/units from SimplyBook.me...");
  try {
    const unitListResponse = await fetch('https://user-api.simplybook.me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Company-Login': companyLogin,
        'X-Token': token
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getUnitList',
        params: [],
        id: 'units'
      })
    });
    
    const unitListResult = await unitListResponse.json();
    if (unitListResult.error) {
      console.error("SimplyBook.me getUnitList Error:", unitListResult.error);
      throw new Error(`Failed to fetch units from SimplyBook.me: ${unitListResult.error.message}`);
    }
    
    const units: Record<string, SimplybookUnit> = unitListResult.result || {};
    console.log(`Retrieved ${Object.keys(units).length} performers/units from SimplyBook.me`);
    return units;
  } catch (error) {
    console.error("Error fetching SimplyBook.me units:", error);
    return {}; // Return empty object in case of error
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
    console.log(`Checking availability using getStartTimeMatrix for event ID ${eventId} on ${date} at ${time}`);
    try {
        // Ensure eventId is a number
        const numericEventId = Number(eventId);
        if (isNaN(numericEventId)) {
            console.error(`Invalid event ID: ${eventId}`);
            return false;
        }

        // Make sure date is in the correct format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            console.error(`Invalid date format: ${date}, expected YYYY-MM-DD`);
            return false;
        }
        
        console.log(`Making API call to SimplyBook.me with eventId=${numericEventId}, date=${date}`);
        
        const response = await fetch('https://user-api.simplybook.me', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Company-Login': companyLogin,
                'X-Token': token
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'getStartTimeMatrix',
                params: [date, date, numericEventId, null, 1],
                id: `check_${eventId}_${date}`
            })
        });
        
        if (!response.ok) {
            console.error(`SimplyBook.me getStartTimeMatrix request failed with status ${response.status}`);
            return false; // Assume unavailable on failure
        }

        const result = await response.json();
        console.log('Raw SimplyBook.me getStartTimeMatrix response:', result);
        
        if (result.error) {
            console.error("SimplyBook.me getStartTimeMatrix Error:", result.error);
            // If method not found, log this specific error
            if (result.error.code === -32601) {
              console.error("METHOD NOT FOUND error received for getStartTimeMatrix. Check API documentation.");
            }
            return false; // Assume unavailable on error
        }

        // Response format for getStartTimeMatrix is { "YYYY-MM-DD": ["HH:MM:SS", ...], ... }
        const availableSlotsForDate: string[] = result.result?.[date] || [];
        const isAvailable = availableSlotsForDate.includes(time);
        
        console.log(`Time slot ${time} on ${date} for event ${eventId} is available: ${isAvailable}`);
        console.log("Available slots for date:", availableSlotsForDate);
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
  let simplybookResult: SimplybookResponse | null = null; // To store simplybook response

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
        // Use provided simplybookEventId if available, otherwise look it up
        let eventId: number;
        if (bookingData.simplybookEventId && typeof bookingData.simplybookEventId === 'number') {
            // Use the provided ID directly
            eventId = bookingData.simplybookEventId;
            console.log(`Using provided SimplyBook.me event ID: ${eventId} for service "${bookingData.service}"`);
        } else {
            // Fall back to looking up by name
            eventId = await getSimplybookEventId(bookingData.service, simplybookCompanyLogin, token);
            console.log(`Looked up event ID for service "${bookingData.service}": ${eventId}`);
        }
        
        // Fetch available performers/units
        const performers = await getSimplybookUnitList(simplybookCompanyLogin, token);
        console.log(`Retrieved ${Object.keys(performers).length} performers/units from SimplyBook.me`);
        
        // Get event details to see which performers can provide this service
        const eventDetailsResponse = await fetch('https://user-api.simplybook.me', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Company-Login': simplybookCompanyLogin,
            'X-Token': token
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'getEvent',
            params: [eventId],
            id: 'event_details'
          })
        });
        
        const eventDetails = await eventDetailsResponse.json();
        console.log("Event details:", eventDetails.result);
        
        // Get available performers for this service from unit_map
        let availablePerformers: number[] = [];
        if (eventDetails.result && eventDetails.result.unit_map) {
          availablePerformers = eventDetails.result.unit_map;
          console.log(`Available performers for service "${bookingData.service}":`, availablePerformers);
        }
        
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
            // If no unitId provided but we have available performers, use the first one
            if (availablePerformers.length > 0) {
                unitId = availablePerformers[0];
                console.log(`No unitId provided, using first available performer: ${unitId}`);
            } else {
                console.log("No unitId provided and no available performers found, defaulting to null.");
            }
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
            
            // Fetch slots for multiple days at once using getStartTimeMatrix
            const endDate = new Date(baseDate);
            endDate.setDate(baseDate.getDate() + 10);
            const endDateFormatted = endDate.toISOString().split('T')[0];
            
            console.log(`Fetching alternative slots from ${formattedDate} to ${endDateFormatted} using getStartTimeMatrix`);
            
            const timeSlotsResponse = await fetch('https://user-api.simplybook.me', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Company-Login': simplybookCompanyLogin,
                'X-Token': token
              },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'getStartTimeMatrix', // Changed method
                params: [formattedDate, endDateFormatted, eventId, unitId, 1], // Corrected order: [dateFrom, dateTo, eventId, unitId, count]
                id: 'alternative_timeslots'
              })
            });
            
            const slotsResult = await timeSlotsResponse.json();
            console.log('Alternative slots response:', slotsResult);
            
            if (slotsResult.error) {
              console.error("Error fetching alternative time slots:", slotsResult.error);
            } else if (slotsResult.result) {
                // Iterate through the dates in the result matrix
                for (const [slotDate, times] of Object.entries(slotsResult.result)) {
                    // Skip the original date we checked
                    if (slotDate === formattedDate) continue;
                    
                    if (Array.isArray(times) && times.length > 0) {
                        suggestions.push({
                            date: slotDate,
                            slots: times.slice(0, 3) // Get first 3 available slots for that date
                        });
                        // Stop if we have enough suggestions
                        if (suggestions.length >= 3) break;
                    }
                }
            }
            
            if (suggestions.length > 0) {
              console.log("Alternative time slots found:", suggestions);
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

        if (!simplybookResponse.ok || (simplybookResult && simplybookResult.error)) {
          console.error("SimplyBook.me 'book' API Error Response:", simplybookResult);
          const errorMessage = simplybookResult?.error?.message || `HTTP status ${simplybookResponse.status}`;
          
          // Handle specific error cases
          if (simplybookResult?.error?.data?.field === 'phone') {
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
           console.log("Successfully created booking on SimplyBook.me:", simplybookResult?.result);
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
    const suggestions = bookingData.suggestedAlternatives || [];
    
    if (simplybookResult && simplybookResult.result) {
         message = "Booking successful on SimplyBook.me and saved internally.";
    } else if (simplybookResult && simplybookResult.error) {
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