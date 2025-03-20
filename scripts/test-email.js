// A simple script to test the email API directly
// Run with: node scripts/test-email.js

const fetch = require('node-fetch');

async function testEmailAPI() {
  try {
    console.log('Testing email API...');
    
    // Your email for testing - replace with the one you want to test with
    const testEmail = 'marlx0879@gmail.com';
    
    // Create a test email payload with all required fields
    const emailPayload = {
      email: testEmail,
      name: 'Test Customer',
      service: 'CPR Test Training',
      date: 'April 15, 2024',
      time: '2:00 PM',
      participants: '1'
    };
    
    console.log('Sending test email with payload:', emailPayload);
    
    // Call your email API endpoint directly
    const response = await fetch('http://localhost:3000/api/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });
    
    // Log the response status
    console.log('Email API response status:', response.status);
    
    // Try to get response body
    let responseBody;
    try {
      responseBody = await response.json();
    } catch (e) {
      responseBody = await response.text();
    }
    
    console.log('Email API response body:', responseBody);
    
    if (response.ok) {
      console.log('Test email sent successfully!');
    } else {
      console.error('Test email failed!');
    }
  } catch (error) {
    console.error('Error testing email API:', error);
  }
}

// Run the test
testEmailAPI(); 