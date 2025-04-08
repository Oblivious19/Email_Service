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
    // Log environment status
    console.log('Email Service Environment:', {
      isVercel: process.env.VERCEL === '1',
      nodeEnv: process.env.NODE_ENV,
      hasSMTPUser: !!process.env.SMTP_USER,
      hasSMTPPass: !!process.env.SMTP_PASS
    });

    // Check if we should use mock
    if (process.env.USE_MOCK_TRANSPORT === 'true') {
      console.log('Using mock transport (explicitly set in environment)');
      _transporter = createMockTransport();
      return _transporter;
    }
    
    // Create real transporter
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    
    if (!smtpUser || !smtpPass) {
      console.warn('Missing SMTP credentials:', {
        hasUser: !!smtpUser,
        hasPass: !!smtpPass
      });
      console.log('Falling back to mock transport due to missing credentials');
      _transporter = createMockTransport();
      return _transporter;
    }
    
    console.log('Creating Gmail transport for:', smtpUser);
    
    _transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass
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
      console.log('Falling back to mock transport due to SMTP verification failure');
      _transporter = createMockTransport();
    }
  }
  
  return _transporter;
}

// Export the transporter initialization function
export const initializeTransporter = async () => {
  try {
    const transport = await getTransporter();
    console.log('Email transport initialized successfully:', {
      type: transport.options?.mock ? 'mock' : 'gmail'
    });
    return transport;
  } catch (error) {
    console.error('Failed to initialize email transport:', error);
    throw error;
  }
};

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
    sendMail: (mailOptions) => {
      return new Promise((resolve) => {
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
        
        resolve({
          messageId: `mock-email-${Date.now()}@localhost`,
          envelope: { from: mailOptions.from, to: mailOptions.to },
          accepted: [mailOptions.to],
          rejected: [],
          pending: [],
          response: 'Mock email sent successfully'
        });
      });
    },
    verify: () => Promise.resolve(true),
    options: { mock: true }
  };
}

// Send email function with improved error handling
export async function sendEmail(mailOptions) {
  try {
    // Initialize or get the transport on each request
    const transport = await getTransporter();
    
    if (!transport) {
      throw new Error('Email transport not initialized');
    }

    console.log('Sending email with:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasAttachments: !!mailOptions.attachments,
      transportType: transport.options?.mock ? 'mock' : 'gmail'
    });

    const info = await transport.sendMail(mailOptions);
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });

    return info;
  } catch (error) {
    console.error('Error in sendEmail:', {
      code: error.code,
      message: error.message,
      command: error.command,
      response: error.response
    });
    throw error;
  }
}

// Initialize the service immediately
try {
  console.log('Initializing email service during module load');
  initializeEmailService();
} catch (error) {
  console.error('Failed to initialize email service during module load:', error);
}
