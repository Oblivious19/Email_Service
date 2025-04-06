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
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  }
});

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: '*', // Allow all origins in production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Handle file upload and email submission
app.post('/submit', (req, res, next) => {
  console.log('Submit endpoint hit:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  const handleUpload = upload.array('attachments');
  
  handleUpload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({
        error: 'File upload error',
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
      await emailController.sendEmailController(req, res, next);
    } catch (error) {
      console.error('Controller error:', error);
      return res.status(500).json({
        error: 'Server error',
        message: 'An error occurred while processing your request',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
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
