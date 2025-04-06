import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import emailController from './controllers/emailcontroller.js';
import { upload, initializeTransporter } from './services/Emailservice.js';
import bodyParser from "body-parser";

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
  NODE_ENV: process.env.NODE_ENV
});

// Add this near the top of your file, after the imports
console.log('Environment Variables Check:', {
  SMTP_USER_EXISTS: !!process.env.SMTP_USER,
  SMTP_PASS_EXISTS: !!process.env.SMTP_PASS,
  USE_MOCK_TRANSPORT: process.env.USE_MOCK_TRANSPORT,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/submit', upload.array('attachments'), emailController.sendEmailController);

// For Vercel serverless deployment, we don't need to listen to a port
// This is only needed for local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const port = 3005;
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}

// Export the Express API for Vercel
export default app;
