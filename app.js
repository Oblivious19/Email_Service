import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import emailController from './controllers/emailcontroller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables first
dotenv.config();

// Log environment variables for debugging
console.log('Environment variables loaded:', {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER ? '✓' : '✗',
  SMTP_PASS: process.env.SMTP_PASS ? '✓' : '✗',
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
    fileSize: 5 * 1024 * 1024, // Reduce to 5MB limit for serverless
    files: 3 // Maximum 3 files for serverless
  }
}).array('attachments', 3); // Pre-configure for attachments field

// Create Express app
const app = express();

// CORS configuration with more specific options
const corsOptions = {
  origin: '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Add OPTIONS handler for preflight requests
app.options('/submit', cors(corsOptions));

// API health check endpoint
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
    size: req.headers['content-length']
  });

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

      await emailController.sendEmailController(req, res);
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

// For local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  // Serve static files in development
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Serve index.html for root path in development
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  
  const port = process.env.PORT || 3005;
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}

// Export the Express app
export default app;
