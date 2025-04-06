import 'dotenv/config';

// Function to safely print credentials (mask if present)
const maskCredential = (value) => {
  if (!value) return 'Not set';
  if (value.includes('your-') || value === 'password123') return 'Using placeholder (not valid)';
  return value.substring(0, 4) + '...' + value.substring(value.length - 4, value.length);
};

console.log('\n==== Email Service Environment Status ====\n');

// SMTP Configuration
console.log('SMTP CONFIGURATION:');
console.log('Host:', process.env.SMTP_HOST || 'Not set (default: smtp.gmail.com)');
console.log('Port:', process.env.SMTP_PORT || 'Not set (default: 587)');
console.log('Secure:', process.env.SMTP_SECURE || 'Not set (default: false)');
console.log('User:', process.env.SMTP_USER || 'Not set');
console.log('Password:', maskCredential(process.env.SMTP_PASS));

// SendGrid Configuration
console.log('\nSENDGRID CONFIGURATION:');
console.log('API Key:', maskCredential(process.env.SENDGRID_API_KEY));
console.log('From Address:', process.env.SENDGRID_FROM || 'Not set (default: noreply@yourdomain.com)');

// Mailgun Configuration
console.log('\nMAILGUN CONFIGURATION:');
console.log('API Key:', maskCredential(process.env.MAILGUN_API_KEY));
console.log('Domain:', process.env.MAILGUN_DOMAIN || 'Not set');
console.log('From Address:', process.env.MAILGUN_FROM || 'Not set (default: mail@yourdomain.com)');

// Other Configuration
console.log('\nOTHER CONFIGURATION:');
console.log('USE_ENV_VARS:', process.env.USE_ENV_VARS || 'Not set');
console.log('USE_MOCK_TRANSPORT:', process.env.USE_MOCK_TRANSPORT || 'Not set (default: false)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set (default: development)');
console.log('VERCEL:', process.env.VERCEL || 'Not set');
console.log('PORT:', process.env.PORT || 'Not set (default: 3000)');

console.log('\n==== Status Summary ====');
const smtpReady = !!process.env.SMTP_USER && !!process.env.SMTP_PASS && 
                 !process.env.SMTP_PASS.includes('your-');
const sendgridReady = !!process.env.SENDGRID_API_KEY && 
                     !process.env.SENDGRID_API_KEY.includes('your-');
const mailgunReady = !!process.env.MAILGUN_API_KEY && !!process.env.MAILGUN_DOMAIN &&
                    !process.env.MAILGUN_API_KEY.includes('your-');
const useMock = process.env.USE_MOCK_TRANSPORT === 'true' || process.env.VERCEL === '1';

console.log('SMTP Provider:', smtpReady ? 'Ready ✅' : 'Not configured ❌');
console.log('SendGrid Provider:', sendgridReady ? 'Ready ✅' : 'Not configured ❌');
console.log('Mailgun Provider:', mailgunReady ? 'Ready ✅' : 'Not configured ❌');
console.log('Mock Transport:', useMock ? 'Enabled ✅' : 'Disabled ❌');

if (!smtpReady && !sendgridReady && !mailgunReady && !useMock) {
  console.log('\n⚠️ WARNING: No email providers are properly configured!');
  console.log('Emails will be sent using mock transport for testing purposes.');
  console.log('For production use, configure at least one provider in your .env file.');
} else if (useMock) {
  console.log('\nℹ️ Mock transport is enabled. Emails will not actually be sent.');
  console.log('This is useful for testing and preview environments.');
} else {
  console.log('\nℹ️ At least one email provider is configured.');
  console.log('Emails will be sent using the selected provider.');
}

console.log('\n==== End of Status Report ====\n'); 