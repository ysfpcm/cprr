import { NextResponse } from 'next/server';

// Define interface for SimplyBook.me unit (performer)
interface SimplybookUnit {
  name: string;
  // Add other known properties if available
  [key: string]: unknown; // For other properties we don't need to explicitly define
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
        id: 'login'
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
    throw error;
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

// Endpoint to check available time slots for a specific event and date
export async function GET(request: Request) {
  try {
    // Get API credentials from environment variables
    const simplybookApiKey = process.env.SIMPLYBOOK_API_KEY;
    const simplybookCompanyLogin = process.env.SIMPLYBOOK_COMPANY_LOGIN;

    if (!simplybookApiKey || !simplybookCompanyLogin) {
      return NextResponse.json(
        { error: "SimplyBook.me credentials are not configured" },
        { status: 500 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId') || '2'; // Default to event ID 2 based on your API response
    let dateParam = url.searchParams.get('date');
    const unitIdParam = url.searchParams.get('unitId'); // Changed let to const
    
    // Get a default date (tomorrow) if none provided
    if (!dateParam) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateParam = tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }

    // Get authentication token
    const token = await getSimplybookToken(simplybookCompanyLogin, simplybookApiKey);

    // First, get all events for reference
    const eventListResponse = await fetch('https://user-api.simplybook.me', {
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
    
    const eventListResult = await eventListResponse.json();
    const events = eventListResult.result || {};
    
    // Get all performers/units
    const performers = await getSimplybookUnitList(simplybookCompanyLogin, token);
    
    // Get event details to see unit_map (performers available for this service)
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
        params: [parseInt(eventId, 10)],
        id: 'event_details'
      })
    });
    
    const eventDetails = await eventDetailsResponse.json();
    const unitMap = eventDetails.result?.unit_map || [];
    
    // Determine which unit/performer to use
    let unitId: number | null = null;
    if (unitIdParam) {
      // Use provided unit ID
      unitId = parseInt(unitIdParam, 10);
      console.log(`Using provided unit ID: ${unitId}`);
    } else if (unitMap.length > 0) {
      // Use first available performer from unit_map if no unit ID provided
      unitId = unitMap[0];
      console.log(`Using first available performer from unit_map: ${unitId}`);
    }
    
    // Get time slots for the specified event and date using getStartTimeMatrix
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
        params: [dateParam, dateParam, parseInt(eventId, 10), unitId, 1], // Corrected order: [dateFrom, dateTo, eventId, unitId, count]
        id: 'timeslots'
      })
    });
    
    const timeSlotsResult = await timeSlotsResponse.json();
    console.log('Raw SimplyBook.me getStartTimeMatrix response:', timeSlotsResult);
    const timeSlotsForDate: string[] = timeSlotsResult.result?.[dateParam] || [];
    
    // Get a calendar with available dates
    const calendarResponse = await fetch('https://user-api.simplybook.me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Company-Login': simplybookCompanyLogin,
        'X-Token': token
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getWorkCalendar',
        params: [
          new Date().getFullYear(), // current year
          new Date().getMonth() + 1, // current month (1-12)
          unitId // Use selected unitId
        ],
        id: 'calendar'
      })
    });
    
    const calendarResult = await calendarResponse.json();
    
    return NextResponse.json({
      events: events,
      performers: performers,
      eventId: eventId,
      unitId: unitId,
      unitMap: unitMap,
      date: dateParam,
      availableTimeSlots: timeSlotsForDate, // Return just the slots for the specified date
      calendar: calendarResult.result || {},
      message: `Found ${timeSlotsForDate.length} available time slots for event ID ${eventId} on ${dateParam}${unitId ? ` with performer ID ${unitId}` : ''}`
    });
  } catch (error) {
    console.error("Error checking time slots:", error);
    return NextResponse.json(
      { 
        error: "Failed to check time slots", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 