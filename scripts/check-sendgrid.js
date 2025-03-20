// Script to check SendGrid configuration
require('dotenv').config({ path: '.env.local' });
const sgMail = require('@sendgrid/mail');

function checkSendGridConfig() {
  console.log('Checking SendGrid configuration...');
  
  // Check if API key is defined
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('Error: SENDGRID_API_KEY is not defined in .env.local');
    return false;
  }
  
  console.log('API key found:', `${apiKey.substring(0, 10)}...`);
  
  // Check if verified sender is defined
  const sender = process.env.SENDGRID_VERIFIED_SENDER;
  if (!sender) {
    console.error('Warning: SENDGRID_VERIFIED_SENDER is not defined in .env.local');
    console.log('Will fallback to default: info@anytimecpr.com');
  } else {
    console.log('Verified sender:', sender);
  }
  
  // Try to initialize SendGrid
  try {
    sgMail.setApiKey(apiKey);
    console.log('SendGrid initialized successfully');
    
    // Create a mock email (won't actually send)
    const mockEmail = {
      to: sender || 'test@example.com',
      from: sender || 'info@anytimecpr.com',
      subject: 'Test Email',
      text: 'This is a test email to validate SendGrid configuration.',
      html: '<p>This is a test email to validate SendGrid configuration.</p>',
    };
    
    console.log('Mock email configuration looks valid:', mockEmail);
    console.log('Note: No email was sent, this is just a configuration check');
    console.log('');
    console.log('If you want to test with SendGrid\'s API directly (not through your app), you can run:');
    console.log('curl -X "POST" "https://api.sendgrid.com/v3/mail/send" -H "Authorization: Bearer YOUR_API_KEY" -H "Content-Type: application/json" -d \'{"personalizations": [{"to": [{"email": "recipient@example.com"}]}],"from": {"email": "' + (sender || 'info@anytimecpr.com') + '"},"subject": "Test Email","content": [{"type": "text/plain", "value": "This is a test email."}]}\'');
    
    return true;
  } catch (error) {
    console.error('Error initializing SendGrid:', error);
    return false;
  }
}

checkSendGridConfig(); 