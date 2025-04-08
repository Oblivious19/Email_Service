import multer from 'multer';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Configure multer for file uploads
export const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

// For Vercel serverless environment, lazily create the transporters only when needed
let _gmailTransporter = null;
let _sendGridTransporter = null;
let _mailgunTransporter = null;
let _etherealTransporter = null;

export function initializeEmailService() {
  console.log('Initializing email service with config:', {
    gmail: process.env.SMTP_USER ? '✓' : '✗',
    sendgrid: process.env.SENDGRID_API_KEY ? '✓' : '✗',
    mailgun: process.env.MAILGUN_API_KEY ? '✓' : '✗',
    ethereal: '✓ (Always available)'
  });
  
  // Initialize transporters (they will be created when needed)
  getTransporter('gmail');
}

// Get the appropriate transporter based on provider
export async function getTransporter(provider = 'gmail') {
  console.log(`Requested email provider: ${provider}`);
  
  switch (provider.toLowerCase()) {
    case 'sendgrid':
      return await getSendGridTransporter();
    case 'mailgun':
      return await getMailgunTransporter();
    case 'ethereal':
      return await getEtherealTransporter();
    case 'gmail':
    default:
      return await getGmailTransporter();
  }
}

// Create a Gmail transporter
export async function getGmailTransporter() {
  if (!_gmailTransporter) {
    // Log environment status
    console.log('Gmail Service Environment:', {
      isVercel: process.env.VERCEL === '1',
      nodeEnv: process.env.NODE_ENV,
      hasSMTPUser: !!process.env.SMTP_USER,
      hasSMTPPass: !!process.env.SMTP_PASS
    });
    
    // Debug: Show credentials (partial)
    if (process.env.SMTP_USER) {
      console.log(`Gmail User (first 4 chars): ${process.env.SMTP_USER.substring(0, 4)}...`);
    }
    if (process.env.SMTP_PASS) {
      console.log(`Gmail Pass (length): ${process.env.SMTP_PASS.length} characters`);
    }

    // Check if we should use mock
    if (process.env.USE_MOCK_TRANSPORT === 'true') {
      console.log('Using mock transport (explicitly set in environment)');
      _gmailTransporter = createMockTransport('gmail');
      return _gmailTransporter;
    }
    
    // Create real transporter
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();
    
    if (!smtpUser || !smtpPass) {
      console.warn('Missing Gmail SMTP credentials:', {
        hasUser: !!smtpUser,
        hasPass: !!smtpPass
      });
      console.log('Falling back to mock transport due to missing credentials');
      _gmailTransporter = createMockTransport('gmail');
      return _gmailTransporter;
    }
    
    console.log('Creating Gmail transport for:', smtpUser);
    
    // Display full transport configuration (without showing password)
    const transportConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: '***HIDDEN***'
      },
      tls: {
        rejectUnauthorized: true,
        minVersion: "TLSv1.2"
      }
    };
    
    console.log('Gmail transport configuration:', transportConfig);
    
    _gmailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
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
      console.log('Verifying Gmail SMTP connection...');
      await _gmailTransporter.verify();
      console.log('✓ Gmail SMTP connection verified successfully');
    } catch (error) {
      console.error('Gmail SMTP Verification Error:', {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        message: error.message
      });
      console.log('Falling back to mock transport due to Gmail SMTP verification failure');
      _gmailTransporter = createMockTransport('gmail');
    }
  }
  
  return _gmailTransporter;
}

// Get Ethereal transporter (for testing)
export async function getEtherealTransporter() {
  if (!_etherealTransporter) {
    // Log environment status
    console.log('Ethereal Test Email Service Environment:', {
      isVercel: process.env.VERCEL === '1',
      nodeEnv: process.env.NODE_ENV
    });

    console.log('Creating Ethereal test account transport');
    
    // Using static credentials (note: in a real app, you'd create a new account with nodemailer.createTestAccount())
    const etherealUser = 'colin.schroeder74@ethereal.email';
    const etherealPass = '5bFmCwhK6F77dFx9dv';
    
    try {
      _etherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: etherealUser,
          pass: etherealPass
        }
      });
      
      // Verify connection configuration
      console.log('Verifying Ethereal SMTP connection...');
      await _etherealTransporter.verify();
      console.log('✓ Ethereal SMTP connection verified successfully');
      
      // Add a custom flag to mark this as Ethereal
      _etherealTransporter.options = { 
        ..._etherealTransporter.options,
        isEthereal: true
      };
      
      // Add message explaining how to view emails
      console.log('📧 Ethereal Email configured. Messages will be catchable at:');
      console.log(`   https://ethereal.email/login (login with ${etherealUser})`);
    } catch (error) {
      console.error('Ethereal SMTP Verification Error:', {
        code: error.code,
        message: error.message
      });
      console.log('Falling back to mock transport due to Ethereal SMTP failure');
      _etherealTransporter = createMockTransport('ethereal');
    }
  }
  
  return _etherealTransporter;
}

// Get SendGrid transporter
export async function getSendGridTransporter() {
  if (!_sendGridTransporter) {
    // Log environment status
    console.log('SendGrid Service Environment:', {
      isVercel: process.env.VERCEL === '1',
      nodeEnv: process.env.NODE_ENV,
      hasSendGridKey: !!process.env.SENDGRID_API_KEY
    });

    // Check if we should use mock
    if (process.env.USE_MOCK_TRANSPORT === 'true') {
      console.log('Using mock transport for SendGrid (explicitly set in environment)');
      _sendGridTransporter = createMockTransport('sendgrid');
      return _sendGridTransporter;
    }
    
    // Check if the API key is the placeholder or missing
    const apiKey = process.env.SENDGRID_API_KEY?.trim();
    const isPlaceholderKey = !apiKey || apiKey === 'SG.yourApiKeyHere' || apiKey === 'your-sendgrid-api-key' || apiKey === 'your_sendgrid_api_key_here';
    
    if (isPlaceholderKey) {
      console.log('Using mock transport instead of SendGrid (missing valid API key)');
      _sendGridTransporter = createCredentialsUnavailableTransport('sendgrid');
      return _sendGridTransporter;
    }
    
    console.log('Creating SendGrid transport');
    
    _sendGridTransporter = nodemailer.createTransport({
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

    // Verify connection configuration
    try {
      await _sendGridTransporter.verify();
      console.log('✓ SendGrid SMTP connection verified successfully');
    } catch (error) {
      console.error('SendGrid SMTP Verification Error:', {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
      console.log('Falling back to mock transport due to SendGrid verification failure');
      _sendGridTransporter = createCredentialsUnavailableTransport('sendgrid');
    }
  }
  
  return _sendGridTransporter;
}

// Get Mailgun transporter
export async function getMailgunTransporter() {
  if (!_mailgunTransporter) {
    // Log environment status
    console.log('Mailgun Service Environment:', {
      isVercel: process.env.VERCEL === '1',
      nodeEnv: process.env.NODE_ENV,
      hasMailgunUser: !!process.env.MAILGUN_USER,
      hasMailgunKey: !!process.env.MAILGUN_API_KEY
    });

    // Check if we should use mock
    if (process.env.USE_MOCK_TRANSPORT === 'true') {
      console.log('Using mock transport for Mailgun (explicitly set in environment)');
      _mailgunTransporter = createMockTransport('mailgun');
      return _mailgunTransporter;
    }
    
    // Check if API key is the placeholder or missing
    const apiKey = process.env.MAILGUN_API_KEY?.trim();
    const username = process.env.MAILGUN_USER?.trim();
    const isPlaceholderKey = !apiKey || apiKey === 'your-mailgun-password' || apiKey === 'your-mailgun-api-key' || apiKey === 'your_mailgun_api_key_here';
    const isPlaceholderUser = !username || username === 'postmaster@your-domain.mailgun.org' || username === 'your_mailgun_user_here';
    
    if (isPlaceholderKey || isPlaceholderUser) {
      console.log('Using credentials unavailable transport instead of Mailgun (missing valid credentials)');
      _mailgunTransporter = createCredentialsUnavailableTransport('mailgun');
      return _mailgunTransporter;
    }
    
    console.log('Creating Mailgun transport');
    
    _mailgunTransporter = nodemailer.createTransport({
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: {
        user: username,
        pass: apiKey
      },
      // These settings help ensure the email shows as sent from Mailgun
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection configuration
    try {
      await _mailgunTransporter.verify();
      console.log('✓ Mailgun SMTP connection verified successfully');
    } catch (error) {
      console.error('Mailgun SMTP Verification Error:', {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      });
      console.log('Falling back to mock transport due to Mailgun verification failure');
      _mailgunTransporter = createCredentialsUnavailableTransport('mailgun');
    }
  }
  
  return _mailgunTransporter;
}

// Create a mock email transporter for testing
export function createMockTransport(provider = 'email') {
  console.log(`Creating mock transport for ${provider} testing`);
  return {
    sendMail: (mailOptions) => {
      return new Promise((resolve) => {
        console.log(`🔵 MOCK ${provider.toUpperCase()} EMAIL SENT`);
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
          messageId: `mock-${provider}-${Date.now()}@localhost`,
          envelope: { from: mailOptions.from, to: mailOptions.to },
          accepted: [mailOptions.to],
          rejected: [],
          pending: [],
          response: `Mock ${provider} email sent successfully`
        });
      });
    },
    verify: () => Promise.resolve(true),
    options: { mock: true, provider }
  };
}

// Create a transporter that returns "Credentials not available" message
export function createCredentialsUnavailableTransport(provider = 'email') {
  console.log(`Creating credentials unavailable transport for ${provider}`);
  return {
    sendMail: (mailOptions) => {
      return new Promise((resolve) => {
        console.log(`⚠️ ${provider.toUpperCase()} CREDENTIALS NOT AVAILABLE`);
        console.log('===================');
        console.log('From:', mailOptions.from);
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Content:', mailOptions.text || mailOptions.html);
        console.log('===================');
        console.log(`NOTE: ${provider} needs valid credentials to work. Using placeholder for now.`);
        
        resolve({
          messageId: `unavailable-${provider}-${Date.now()}@localhost`,
          envelope: { from: mailOptions.from, to: mailOptions.to },
          accepted: [mailOptions.to],
          rejected: [],
          pending: [],
          response: `${provider} email not sent: Credentials not available, please configure later`
        });
      });
    },
    verify: () => Promise.resolve(true),
    options: { mock: true, provider, credentialsUnavailable: true }
  };
}

// Send email function with improved error handling and provider selection
export async function sendEmail(mailOptions, provider = 'gmail') {
  try {
    // Initialize or get the transport on each request based on provider
    const transport = await getTransporter(provider);
    
    if (!transport) {
      throw new Error(`Email transport for ${provider} not initialized`);
    }

    // Special handling for Ethereal
    if (transport.options?.isEthereal) {
      // Always set from address for Ethereal if not set
      if (!mailOptions.from) {
        mailOptions.from = 'colin.schroeder74@ethereal.email';
      }
    }
    
    // Handle credentials unavailable case
    if (transport.options?.credentialsUnavailable) {
      console.log(`${provider} credentials not available, sending simulated response`);
      const info = await transport.sendMail(mailOptions);
      return { 
        ...info,
        credentialsUnavailable: true,
        message: `${provider} provider needs configuration. Please add valid credentials to use this service.`
      };
    }

    console.log(`Sending email with ${provider}:`, {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasAttachments: !!mailOptions.attachments,
      transportType: transport.options?.mock ? `mock-${provider}` : provider
    });

    const info = await transport.sendMail(mailOptions);
    
    // Special handling for Ethereal to provide the email preview URL
    if (transport.options?.isEthereal && info.messageId) {
      console.log(`✓ Ethereal test email sent. View it here: https://ethereal.email/message/${info.messageId}`);
      info.previewUrl = `https://ethereal.email/message/${info.messageId}`;
    }
    
    console.log(`Email sent successfully via ${provider}:`, {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
      previewUrl: info.previewUrl || 'N/A'
    });

    return info;
  } catch (error) {
    console.error(`Error in sendEmail with ${provider}:`, {
      code: error.code,
      message: error.message,
      command: error.command,
      response: error.response
    });
    throw error;
  }
}
