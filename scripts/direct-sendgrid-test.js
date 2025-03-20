// Direct SendGrid test bypassing our API route
require('dotenv').config({ path: '.env.local' });
const sgMail = require('@sendgrid/mail');

async function testSendGridDirectly() {
  try {
    console.log('Testing SendGrid directly...');
    
    // Set the API key
    const apiKey = process.env.SENDGRID_API_KEY;
    sgMail.setApiKey(apiKey);
    
    // Get the sender email
    const sender = process.env.SENDGRID_VERIFIED_SENDER || process.env.SENDGRID_FROM_EMAIL;
    
    // Create a simple email
    const msg = {
      to: sender, // Send to yourself for testing
      from: sender, // Must be a verified sender in SendGrid
      subject: 'Direct SendGrid Test',
      text: 'This is a direct test of SendGrid without going through the API route.',
      html: '<p>This is a direct test of SendGrid without going through the API route.</p>',
    };
    
    console.log('Sending email with the following configuration:');
    console.log('- To:', msg.to);
    console.log('- From:', msg.from);
    console.log('- Subject:', msg.subject);
    
    // Send the email
    const response = await sgMail.send(msg);
    
    console.log('SendGrid Response:', response);
    console.log('Email sent successfully!');
    
  } catch (error) {
    console.error('SendGrid Error:');
    
    if (error.response) {
      // Extract SendGrid error details
      console.error('Status code:', error.response.statusCode);
      console.error('Body:', error.response.body);
      console.error('Headers:', error.response.headers);
    } else {
      console.error(error);
    }
  }
}

testSendGridDirectly(); 