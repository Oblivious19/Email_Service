import multer from 'multer';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Configure multer for file uploads
export const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

// For Vercel serverless environment, lazily create the transporters only when needed
let _transporter = null;
let _sendGridTransporter = null;
let _mailgunTransporter = null;

// Create a Gmail transporter
export function getTransporter() {
  if (!_transporter) {
    // Check if we should use mock
    if (process.env.USE_MOCK_TRANSPORT === 'true' || 
        (process.env.VERCEL === '1' && process.env.NODE_ENV !== 'production')) {
      console.log('Using mock transport (environment determined)');
      return createMockTransport();
    }
    
    // Create real transporter
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
      }
    });
  }
  
  return _transporter;
}

// Export the transporter
export const transporter = getTransporter();

// Create SendGrid transporter
export function createSendGridTransport() {
  console.log('Creating SendGrid transporter');
  
  // Check if the API key is the placeholder or missing
  const apiKey = process.env.SENDGRID_API_KEY || 'SG.yourApiKeyHere';
  const isPlaceholderKey = apiKey === 'SG.yourApiKeyHere' || apiKey === 'your-sendgrid-api-key';
  
  if (isPlaceholderKey) {
    console.log('Using mock transport instead of SendGrid (missing valid API key)');
    return createMockTransport();
  }
  
  return nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey', // SendGrid requires 'apikey' as the username
      pass: apiKey, // Use the API key from environment variables
    },
    // These settings help ensure the email shows as sent from SendGrid
    tls: {
      rejectUnauthorized: false
    }
  });
}

// Create Mailgun transporter
export function createMailgunTransport() {
  console.log('Creating Mailgun transporter');
  
  // Check if API key is the placeholder or missing
  const apiKey = process.env.MAILGUN_API_KEY || 'your-mailgun-password';
  const isPlaceholderKey = apiKey === 'your-mailgun-password' || apiKey === 'your-mailgun-api-key';
  
  if (isPlaceholderKey) {
    console.log('Using mock transport instead of Mailgun (missing valid API key)');
    return createMockTransport();
  }
  
  return nodemailer.createTransport({
    host: 'smtp.mailgun.org',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAILGUN_USER || 'postmaster@your-domain.mailgun.org', // would use actual username in production
      pass: apiKey, // Use the API key from environment variables
    },
    // These settings help ensure the email shows as sent from Mailgun
    tls: {
      rejectUnauthorized: false
    }
  });
}

// Create a mock email transporter for testing
export function createMockTransport() {
  console.log('Creating mock transport for testing');
  return {
    sendMail: (mailOptions, callback) => {
      // Log the email content for debugging
      console.log('🔵 MOCK EMAIL SENT');
      console.log('===================');
      console.log('From:', mailOptions.from);
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Content:', mailOptions.text || mailOptions.html);
      if (mailOptions.attachments && mailOptions.attachments.length > 0) {
        console.log('Attachments:', mailOptions.attachments.length);
      }
      console.log('===================');
      
      // Simulate a delay to mimic actual email sending
      setTimeout(() => {
        const info = {
          messageId: `mock-email-${Date.now()}@localhost`,
          envelope: {
            from: mailOptions.from,
            to: mailOptions.to
          },
          accepted: [mailOptions.to],
          rejected: [],
          pending: [],
          response: 'Mock email sent successfully'
        };
        
        callback(null, info);
      }, 500); // 500ms delay
    }
  };
}

// Send email function with error handling
export function sendEmail(mailOptions) {
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        reject(error);
        return;
      }
      
      console.log('Email sent:', info.messageId);
      resolve(info);
    });
  });
}
