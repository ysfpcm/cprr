import { NextResponse } from 'next/server';

// Define interface for SimplyBook.me unit (performer)
interface SimplybookUnit {
  name: string;
  // Add other known properties if available
  [key: string]: unknown; // For other properties we don't need to explicitly define
}

// Helper function to format phone number for SimplyBook.me
function formatPhoneNumber(phoneString: string): string {
  // Return a default phone number if input is empty or undefined
  if (!phoneString || phoneString.trim() === '') {
    console.log("Empty phone provided, using default SimplyBook.me compatible number");
    return '+15555555555'; // Default placeholder number for SimplyBook.me
  }
  
  // Remove all non-digit characters
  const digitsOnly = phoneString.replace(/\D/g, '');
  
  if (digitsOnly.length === 0) {
    // If after cleaning there are no digits, use default
    return '+15555555555';
  }
  
  // SimplyBook.me seems to expect a standardized format with country code
  // If the phone doesn't start with country code, add +1 (US) prefix
  let formattedPhone = digitsOnly;
  
  // If it doesn't start with +, add appropriate country code
  if (!phoneString.startsWith('+')) {
    // If first digit is 1 and total length is 11 (US format with country code)
    if (digitsOnly.startsWith('1') && digitsOnly.length === 11) {
      formattedPhone = `+${digitsOnly}`;
    } else {
      // For US/CA numbers, assume +1 country code if 10 digits
      if (digitsOnly.length === 10) {
        formattedPhone = `+1${digitsOnly}`;
      } else {
        // For other lengths, just add + prefix but this may not be valid
        formattedPhone = `+${digitsOnly}`;
      }
    }
  } else {
    // Already has + prefix in original
    formattedPhone = `+${digitsOnly}`;
  }
  
  console.log(`Formatted phone from "${phoneString}" to "${formattedPhone}"`);
  return formattedPhone;
}

// Helper function to get SimplyBook.me auth token (same as in bookings route)
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

// Helper function to get performers/units
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

// Route to check SimplyBook API status and test phone validation
export async function GET() {
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

    // Get authentication token
    const token = await getSimplybookToken(simplybookCompanyLogin, simplybookApiKey);

    // Validate phone format examples
    const phoneExamples = [
      { original: "(555) 123-4567", formatted: formatPhoneNumber("(555) 123-4567") },
      { original: "555-123-4567", formatted: formatPhoneNumber("555-123-4567") },
      { original: "1-555-123-4567", formatted: formatPhoneNumber("1-555-123-4567") },
      { original: "+1 555-123-4567", formatted: formatPhoneNumber("+1 555-123-4567") },
      { original: "5551234567", formatted: formatPhoneNumber("5551234567") },
    ];
    
    // Fetch actual event list from SimplyBook.me for debugging 
    console.log("Fetching event list from SimplyBook.me...");
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
    console.log("SimplyBook.me events:", eventListResult);
    
    const events = eventListResult.result || {};
    
    // Get performers/units
    const performers = await getSimplybookUnitList(simplybookCompanyLogin, token);
    
    // Check available time slots for a specific event (just for testing)
    const testEventId = Object.keys(events)[0]; // Get first event ID if available
    let timeSlotTestResult = {};
    
    if (testEventId) {
      // Get a future date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const testDate = tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      // Get event details to check unit_map
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
          params: [parseInt(testEventId, 10)],
          id: 'event_details'
        })
      });
      
      const eventDetails = await eventDetailsResponse.json();
      const unitMap = eventDetails.result?.unit_map || [];
      const firstPerformer = unitMap.length > 0 ? unitMap[0] : null;
      
      console.log(`Fetching time slots for event ID ${testEventId} on ${testDate} using getStartTimeMatrix...`);
      const timeSlotsResponse = await fetch('https://user-api.simplybook.me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': simplybookCompanyLogin,
          'X-Token': token
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'getStartTimeMatrix',
          params: [testDate, testDate, parseInt(testEventId, 10), firstPerformer, 1],
          id: 'timeslots'
        })
      });
      
      const timeSlotsResult = await timeSlotsResponse.json();
      console.log("SimplyBook.me time slots (getStartTimeMatrix):", timeSlotsResult);
      timeSlotTestResult = {
        eventId: testEventId,
        date: testDate,
        performerId: firstPerformer,
        availableSlots: timeSlotsResult.result?.[testDate] || [],
        eventDetails: eventDetails.result || {},
        rawMatrixResponse: timeSlotsResult.result || {}
      };
    }

    return NextResponse.json({
      status: "API connection successful",
      token: token ? "Valid token received" : "Failed to get token",
      phoneFormatting: phoneExamples,
      events: events,
      performers: performers,
      timeSlotTest: timeSlotTestResult,
      message: "SimplyBook.me API is properly configured. The response includes available events, performers, and a test time slot query using getStartTimeMatrix."
    });
  } catch (error) {
    console.error("Error in SimplyBook.me status check:", error);
    return NextResponse.json(
      { 
        error: "Failed to connect to SimplyBook.me API", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 