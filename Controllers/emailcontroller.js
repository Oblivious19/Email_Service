import { sendEmail } from "../services/Emailservice.js";

async function sendEmailController(req, res) {
  console.log('📧 Email send request received');
  console.log('Request body:', req.body);
  console.log('Attachments:', req.files ? `${req.files.length} files` : 'No attachments');

  try {
    // Check for required fields
    if (!req.body.to || !req.body.subject || !req.body.tbody) {
      console.log('❌ Missing required fields');
      return res.status(400).send('Missing required fields in the request body.');
    }

    // Extract fields from req.body
    const { from, to, subject, tbody, cc, bcc } = req.body;
    const attachments = req.files || [];

    // Set the from address
    const fromAddress = from || process.env.SMTP_USER;
    
    if (!fromAddress) {
      console.error('❌ No sender email address configured');
      return res.status(500).send('No sender email address configured. Please check SMTP_USER in .env');
    }

    // Construct mail options
    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      text: tbody,
      cc,
      bcc,
      attachments: attachments.map(file => ({
        filename: file.originalname,
        content: file.buffer
      }))
    };
    
    console.log('Attempting to send email with options:', {
      from: fromAddress,
      to,
      subject,
      hasAttachments: attachments.length > 0
    });

    try {
      const info = await sendEmail(mailOptions);
      console.log('✅ Email sent successfully:', info);
      res.send(`Email sent successfully. Message ID: ${info.messageId}`);
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError);
      
      // Check if this is an authentication error
      if (emailError.code === 'EAUTH') {
        return res.status(401).send(
          'Authentication failed. Please check your Gmail account settings:\n' +
          '1. Ensure 2-Step Verification is enabled\n' +
          '2. Use an App Password instead of your regular password\n' +
          '3. Make sure the App Password is correctly copied to SMTP_PASS in .env'
        );
      }
      
      // Check if this is a connection error
      if (emailError.code === 'ECONNECTION') {
        return res.status(503).send(
          'Failed to connect to Gmail. Please check:\n' +
          '1. Your internet connection\n' +
          '2. Gmail service status\n' +
          '3. Any firewall or antivirus settings'
        );
      }

      res.status(500).send(`Failed to send email: ${emailError.message}`);
    }
  } catch (error) {
    console.error('❌ Controller error:', error);
    res.status(500).send(`Server error: ${error.message}`);
  }
}

export default { sendEmailController };  
