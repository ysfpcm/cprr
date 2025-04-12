import { NextResponse } from 'next/server';

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
    
    // Get time slots for the specified event and date
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
        params: {
          event_id: parseInt(eventId, 10),
          unit_id: null,
          date: dateParam
        },
        id: 'timeslots'
      })
    });
    
    const timeSlotsResult = await timeSlotsResponse.json();
    console.log('Raw SimplyBook.me getStartTimeList response:', timeSlotsResult);
    const timeSlots = timeSlotsResult.result || [];
    
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
          null // unitId (null for any provider)
        ],
        id: 'calendar'
      })
    });
    
    const calendarResult = await calendarResponse.json();
    
    return NextResponse.json({
      events: events,
      eventId: eventId,
      date: dateParam,
      availableTimeSlots: timeSlots,
      calendar: calendarResult.result || {},
      message: `Found ${timeSlots.length} available time slots for event ID ${eventId} on ${dateParam}`
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