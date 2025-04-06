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

export function initializeEmailService() {
  console.log('Initializing email service with config:', {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? '***' : undefined
  });
  
  // Create the transporter
  getTransporter();
}

// Create a Gmail transporter
export async function getTransporter() {
  if (!_transporter) {
    // Check if we should use mock
    if (process.env.USE_MOCK_TRANSPORT === 'true' || 
        (process.env.VERCEL === '1' && process.env.NODE_ENV !== 'production')) {
      console.log('Using mock transport (environment determined)');
      _transporter = createMockTransport();
      return _transporter;
    }
    
    // Create real transporter
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    
    if (!smtpUser || !smtpPass) {
      console.error('Missing SMTP credentials. Check your .env file.');
      _transporter = createMockTransport();
      return _transporter;
    }
    
    console.log('Creating Gmail transport with:', {
      user: smtpUser,
      host: 'smtp.gmail.com',
      port: 587
    });
    
    _transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: smtpUser.trim(),
        pass: smtpPass.trim()
      },
      tls: {
        rejectUnauthorized: true,
        minVersion: "TLSv1.2"
      }
    });

    // Verify connection configuration
    try {
      await _transporter.verify();
      console.log('✓ SMTP connection verified successfully');
    } catch (error) {
      console.error('SMTP Verification Error:', {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
      console.log('Falling back to mock transport due to verification error');
      _transporter = createMockTransport();
    }
  }
  
  return _transporter;
}

// Export the transporter initialization function instead of the instance
export const initializeTransporter = () => getTransporter();

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
      
      setTimeout(() => {
        callback(null, {
          messageId: `mock-email-${Date.now()}@localhost`,
          envelope: { from: mailOptions.from, to: mailOptions.to },
          accepted: [mailOptions.to],
          rejected: [],
          pending: [],
          response: 'Mock email sent successfully'
        });
      }, 100);
    },
    verify: (callback) => callback(null, true),
    options: { mock: true }
  };
}

// Send email function with error handling
export async function sendEmail(mailOptions) {
  const transport = await getTransporter();
  
  console.log('Sending email with:', {
    from: mailOptions.from,
    to: mailOptions.to,
    subject: mailOptions.subject,
    hasAttachments: !!mailOptions.attachments,
    transportType: transport.options?.mock ? 'mock' : 'gmail'
  });

  try {
    const info = await new Promise((resolve, reject) => {
      transport.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          reject(error);
          return;
        }
        resolve(info);
      });
    });

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });

    return info;
  } catch (error) {
    console.error('Failed to send email:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    throw error;
  }
}
