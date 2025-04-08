import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { sendEmailController } from './controllers/emailController.js';
import { initializeEmailService } from './services/Emailservice.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables first
console.log('⏳ Loading environment variables...');
dotenv.config();
console.log('✓ Environment variables loaded');

// Debug: Check if Gmail credentials exist
console.log('🔍 Gmail SMTP credentials check:');
console.log('- SMTP_HOST:', process.env.SMTP_HOST || 'not set');
console.log('- SMTP_PORT:', process.env.SMTP_PORT || 'not set');
console.log('- SMTP_USER:', process.env.SMTP_USER ? '✓ set' : '❌ not set');
console.log('- SMTP_PASS:', process.env.SMTP_PASS ? '✓ set' : '❌ not set');
console.log('- USE_MOCK_TRANSPORT:', process.env.USE_MOCK_TRANSPORT);

// Set default environment variables for development
if (process.env.NODE_ENV !== 'production') {
  // Gmail setup check
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️ Gmail SMTP credentials not found in environment, using mock transport');
    process.env.USE_MOCK_TRANSPORT = 'true';
  }
  
  // SendGrid setup check
  if (!process.env.SENDGRID_API_KEY) {
    console.log('⚠️ SendGrid API key not found in environment');
  }
  
  // Mailgun setup check
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_USER) {
    console.log('⚠️ Mailgun credentials not found in environment');
  }
  
  // Ensure required variables have default values
  process.env.SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  process.env.SMTP_PORT = process.env.SMTP_PORT || '587';
  process.env.USE_ENV_VARS = process.env.USE_ENV_VARS || 'true';
}

// Initialize email service
try {
  console.log('Initializing email service from app.js');
  initializeEmailService();
} catch (error) {
  console.error('Email service initialization failed:', error);
}

// Log environment variables for debugging
console.log('Environment variables loaded:', {
  // Gmail config
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER ? '✓' : '✗',
  SMTP_PASS: process.env.SMTP_PASS ? '✓' : '✗',
  
  // SendGrid config
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? '✓' : '✗',
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || '(using SMTP_USER)',
  
  // Mailgun config
  MAILGUN_API_KEY: process.env.MAILGUN_API_KEY ? '✓' : '✗',
  MAILGUN_USER: process.env.MAILGUN_USER ? '✓' : '✗',
  MAILGUN_FROM_EMAIL: process.env.MAILGUN_FROM_EMAIL || '(using MAILGUN_USER)',
  
  // General config
  USE_ENV_VARS: process.env.USE_ENV_VARS,
  USE_MOCK_TRANSPORT: process.env.USE_MOCK_TRANSPORT,
  NODE_ENV: process.env.NODE_ENV,
  IS_VERCEL: process.env.VERCEL === '1'
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for serverless
    files: 3 // Maximum 3 files
  }
}).array('attachments', 3);

// Create Express app
const app = express();

// Security headers middleware
app.use((req, res, next) => {
  // Set proper Content-Security-Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self';"
  );
  
  // Add Cache-Control headers to prevent caching issues
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  next();
});

// Basic CORS configuration
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// Body parsing middleware with limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve static files in all environments with cache busting
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.html') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
    }
  }
}));

// Root route handler
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: process.env.NODE_ENV,
    vercel: process.env.VERCEL === '1',
    timestamp: new Date().toISOString()
  });
});

// Handle file upload and email submission
app.post('/submit', (req, res) => {
  console.log('Submit endpoint hit:', {
    method: req.method,
    contentType: req.headers['content-type'],
    size: req.headers['content-length'],
    isVercel: process.env.VERCEL === '1'
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({
        error: 'File upload error',
        code: err.code,
        message: err.message
      });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({
        error: 'Server error',
        message: 'An error occurred while processing the file upload'
      });
    }

    try {
      // Validate request body
      if (!req.body || !req.body.to) {
        throw new Error('Missing required fields');
      }

      await sendEmailController(req, res);
    } catch (error) {
      console.error('Controller error:', error);
      return res.status(500).json({
        error: 'Server error',
        message: error.message || 'An error occurred while processing your request'
      });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Server error',
    message: err.message || 'An unexpected error occurred',
    code: 'FUNCTION_ERROR'
  });
});

// Always listen on a port when not in Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express app for Vercel
export default app;
