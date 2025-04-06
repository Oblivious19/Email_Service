import { sendEmail } from "../services/Emailservice.js"; 
import { transporter } from "../services/Emailservice.js"; 
import { createSendGridTransport, createMailgunTransport, createMockTransport } from "../services/Emailservice.js";

async function sendEmailController(req, res) {
  console.log('📧 Email send request received');
  console.log('Running on Vercel?', process.env.VERCEL ? 'Yes' : 'No');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log(req.body);   // Log form data
  console.log(req.files ? `Attachments: ${req.files.length}` : 'No attachments');  // Log file uploads

  try {
    // Check for required fields
    if (!req.body.to || !req.body.subject || !req.body.tbody) {
      console.log('❌ Missing required fields');
      return res.status(400).send('Missing required fields in the request body.');
    }

    // Extract fields from req.body
    const { from, to, subject, tbody, cc, bcc, smtpProvider } = req.body;
    const attachments = req.files || [];  // Handle file uploads

    // Set the from address based on the provider
    let fromAddress = from || process.env.SMTP_USER || "rahulpurohitrp789rp@gmail.com"; // Default Gmail sender
    let providerName = "Gmail";
    
    if (smtpProvider) {
      console.log(`Using provider: ${smtpProvider}`);
      
      switch(smtpProvider) {
        case 'sendgrid':
          // In production, this should be your verified SendGrid sender
          fromAddress = process.env.SENDGRID_FROM || "noreply@yourdomain.com";
          providerName = "SendGrid";
          break;
        case 'mailgun':
          // In production, this should be your verified Mailgun sender
          fromAddress = process.env.MAILGUN_FROM || "mail@yourdomain.com";
          providerName = "Mailgun";
          break;
        case 'custom':
          // Use the default transporter
          break;
      }
    } else {
      console.log('No provider specified, using default');
    }

    // Construct mail options
    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      text: tbody,  // Use 'text' for plain text content
      cc,
      bcc,
      attachments: attachments.map(file => ({
        filename: file.originalname,
        content: file.buffer
      }))
    };
    
    console.log(`Mail from: ${fromAddress}, to: ${to}, subject: ${subject}`);

    // Check if we're in a demo/preview environment (like Vercel preview deployments)
    const isDemo = process.env.VERCEL === '1' && process.env.NODE_ENV !== 'production';
    
    // Select the appropriate transport based on smtpProvider and environment
    let selectedTransporter;
    
    if (isDemo) {
      console.log('✅ Using mock transporter for Vercel preview');
      selectedTransporter = createMockTransport();
    } else {
      console.log(`✅ Using ${smtpProvider || 'default'} as email provider`);
      
      switch(smtpProvider) {
        case 'sendgrid':
          selectedTransporter = createSendGridTransport();
          break;
        case 'mailgun':
          selectedTransporter = createMailgunTransport();
          break;
        case 'custom':
          // Use the default transporter but display message to user
          console.log('Custom SMTP is in development');
          return res.status(202).send('Custom SMTP is coming soon. Using Gmail for now.');
        default:
          // Use the default transporter
          selectedTransporter = transporter;
          break;
      }
    }

    // Send email with selected transporter
    selectedTransporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Email sending error:', error.message);
        
        // Check if this is an authentication error for SendGrid or Mailgun
        if (error.code === 'EAUTH' && 
           (smtpProvider === 'sendgrid' || smtpProvider === 'mailgun')) {
          console.log(`Falling back to mock transport after ${smtpProvider} authentication failed`);
          
          // Fallback to mock transport
          const mockTransporter = createMockTransport();
          
          // Try again with mock transport
          return mockTransporter.sendMail(mailOptions, (mockError, mockInfo) => {
            if (mockError) {
              console.error('Mock email error:', mockError);
              return res.status(500).send(mockError.toString());
            }
            
            console.log('Email sent via mock transport:', mockInfo);
            return res.status(202).send(
              `Note: ${smtpProvider} authentication failed. ` + 
              `A simulated email was sent instead. In production, please use valid credentials.`
            );
          });
        }
        
        return res.status(500).send(error.toString());
      }
      
      console.log('✅ Email sent successfully:', info.response || 'Success');
      res.send(`Email sent via ${providerName}: ${info.response || 'Success'}`);
    });
    
  } catch (error) {
    console.error('❌ Controller error:', error.message);
    res.status(500).json({ error: error.message });
  }
}

export default { sendEmailController };  
