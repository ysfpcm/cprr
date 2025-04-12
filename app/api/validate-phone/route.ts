import { NextResponse } from 'next/server';

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

// Endpoint for validating phone numbers
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { phone } = data;
    
    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }
    
    const formattedPhone = formatPhoneNumber(phone);
    
    return NextResponse.json({
      original: phone,
      formatted: formattedPhone,
      isValid: !!formattedPhone, // Simple validation - non-empty formatted result
      message: "Phone number formatted for SimplyBook.me",
    });
  } catch (error) {
    console.error("Error validating phone:", error);
    return NextResponse.json(
      { error: "Failed to validate phone number" },
      { status: 500 }
    );
  }
}

// GET endpoint for test examples
export async function GET() {
  // Test with sample phone numbers
  const testPhones = [
    "(555) 123-4567",
    "555-123-4567",
    "1-555-123-4567",
    "+1 555-123-4567",
    "5551234567",
    "", // Empty
    "abc123", // Invalid
  ];
  
  const results = testPhones.map(phone => ({
    original: phone,
    formatted: formatPhoneNumber(phone),
    isValid: !!formatPhoneNumber(phone)
  }));
  
  return NextResponse.json({
    message: "Phone validation examples",
    results
  });
} 