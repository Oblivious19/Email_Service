import { sendEmail } from "../services/Emailservice.js";

async function sendEmailController(req, res) {
  console.log('📧 Email send request received');
  console.log('Request body:', {
    to: req.body.to,
    subject: req.body.subject,
    hasContent: !!req.body.tbody,
    attachments: req.files ? req.files.length : 0
  });

  try {
    // Check for required fields
    const missingFields = [];
    if (!req.body.to) missingFields.push('to');
    if (!req.body.subject) missingFields.push('subject');
    if (!req.body.tbody) missingFields.push('message content');

    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields: missingFields
      });
    }

    // Extract fields from req.body
    const { from, to, subject, tbody, cc, bcc } = req.body;
    const attachments = req.files || [];

    // Set the from address
    const fromAddress = from || process.env.SMTP_USER;
    
    if (!fromAddress) {
      console.error('❌ No sender email address configured');
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Email service not properly configured. Please check server environment variables.'
      });
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
    
    try {
      const info = await sendEmail(mailOptions);
      console.log('✅ Email sent successfully:', info);
      res.json({
        success: true,
        messageId: info.messageId,
        response: info.response
      });
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError);
      
      // Check for specific error types
      switch(emailError.code) {
        case 'EAUTH':
          return res.status(401).json({
            error: 'Authentication failed',
            message: 'Gmail authentication failed. Please ensure:\n' +
                    '1. You\'re using an App Password (not regular password)\n' +
                    '2. 2-Step Verification is enabled on your Gmail account\n' +
                    '3. The App Password is correctly configured in the server'
          });
        
        case 'ECONNECTION':
          return res.status(503).json({
            error: 'Connection failed',
            message: 'Could not connect to Gmail. Please check:\n' +
                    '1. Server internet connection\n' +
                    '2. Gmail service status\n' +
                    '3. Server firewall settings'
          });
        
        case 'ESOCKET':
          return res.status(503).json({
            error: 'Network error',
            message: 'Network connection issue. Please try again.'
          });
        
        default:
          return res.status(500).json({
            error: 'Email sending failed',
            message: emailError.message,
            code: emailError.code
          });
      }
    }
  } catch (error) {
    console.error('❌ Controller error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An unexpected error occurred. Please check server logs.'
    });
  }
}

export default { sendEmailController };  
