// Alternative email test using nodemailer with Ethereal for testing
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testEmailAlternative() {
  try {
    console.log('Testing email using Nodemailer + Ethereal...');
    
    // Create a test account on Ethereal (fake SMTP service for testing)
    const testAccount = await nodemailer.createTestAccount();
    console.log('Created test account on Ethereal:', testAccount.user);
    
    // Create a transporter using the test account
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    // Prepare test data similar to what we'd use in the real app
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      service: 'CPR Basic Training',
      date: new Date().toISOString(),
      time: '10:00 AM',
      participants: '1',
    };
    
    // Format date for display
    const formattedDate = new Date(testData.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Create email content (simplified version of what's in our API)
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e4;">
        <h1 style="color: green;">Booking Confirmation</h1>
        <p>Hello ${testData.name},</p>
        <p>Thank you for booking your CPR training. Your booking has been confirmed!</p>
        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details</h3>
          <p><strong>Service:</strong> ${testData.service}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${testData.time}</p>
          <p><strong>Participants:</strong> ${testData.participants}</p>
        </div>
        <p>Best regards,<br>The Anytime CPR Team</p>
      </div>
    `;
    
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: '"Anytime CPR" <test@anytimecpr.com>',
      to: testData.email,
      subject: 'Booking Confirmation - Anytime CPR',
      text: `Booking Confirmation for ${testData.service} on ${formattedDate} at ${testData.time}`,
      html: emailContent,
    });
    
    console.log('Message sent:', info.messageId);
    
    // Preview URL (only works with Ethereal)
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    console.log('Open the preview URL in your browser to see the test email');
    console.log('\nIMPORTANT: This is just a test. To fix your SendGrid integration:');
    console.log('1. Log in to your SendGrid account');
    console.log('2. Go to Settings > Sender Authentication');
    console.log('3. Verify the email address: ' + process.env.SENDGRID_VERIFIED_SENDER);
    console.log('4. Check your email and follow the verification link SendGrid sends');
    
  } catch (error) {
    console.error('Error testing alternative email:', error);
  }
}

// Install nodemailer if needed
try {
  testEmailAlternative();
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.error('nodemailer is not installed. Please run: npm install nodemailer');
  } else {
    console.error('Unexpected error:', e);
  }
} 