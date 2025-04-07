import { sendEmail } from "../services/Emailservice.js";


async function sendEmailController(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log(' Email send request received');
    console.log('Request body:', {
      to: req.body.to,
      subject: req.body.subject,
      hasContent: !!req.body.tbody,
      attachments: req.files ? req.files.length : 0,
      environment: process.env.NODE_ENV,
      isVercel: process.env.VERCEL === '1'
    });
