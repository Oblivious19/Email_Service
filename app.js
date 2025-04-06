import express from 'express';
import emailController from './Controllers/emailcontroller.js';
import { upload } from './services/Emailservice.js';  // Import the upload middleware
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from "body-parser";
import multer from "multer";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/submit', upload.array('attachments'), emailController.sendEmailController);

const port = process.env.PORT || 3000;
const startServer = () => {
  const server = app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use. Trying port ${port + 1}...`);
      // Try the next port
      process.env.PORT = port + 1;
      server.close();
      startServer();
    } else {
      console.error('Server error:', e);
    }
  });
};

startServer();
