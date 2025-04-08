import { sendEmail } from "../services/Emailservice.js";

async function sendEmailController(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log('📧 Email send request received');
    console.log('Request body:', {
      to: req.body.to,
      subject: req.body.subject,
      hasContent: !!req.body.tbody,
      attachments: req.files ? req.files.length : 0,
      provider: req.body.provider || 'gmail',
      environment: process.env.NODE_ENV,
      isVercel: process.env.VERCEL === '1'
    });

    // Check for required fields
    const missingFields = [];
    if (!req.body.to) missingFields.push('to');
    if (!req.body.subject) missingFields.push('subject');
    if (!req.body.tbody) missingFields.push('message content');

    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      return res.status(400).json({
        error: 'Missing required fields',
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Extract fields from req.body
    const { from, to, subject, tbody, cc, bcc, provider = 'gmail' } = req.body;
    
    // Validate provider value
    const validProviders = ['gmail', 'sendgrid', 'mailgun', 'ethereal'];
    const selectedProvider = provider.toLowerCase();
    
    if (!validProviders.includes(selectedProvider)) {
      return res.status(400).json({
        error: 'Invalid provider',
        message: `Invalid email provider: ${provider}. Valid options are: ${validProviders.join(', ')}`
      });
    }
    
    // Check if provider-specific credentials are set (Ethereal is always available)
    let credentialsError = null;
    
    if (selectedProvider !== 'ethereal') { // Skip credential check for Ethereal
      switch(selectedProvider) {
        case 'gmail':
          if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            credentialsError = 'Gmail SMTP credentials are not configured';
          }
          break;
        case 'sendgrid':
          if (!process.env.SENDGRID_API_KEY) {
            credentialsError = 'SendGrid API key is not configured';
          }
          break;
        case 'mailgun':
          if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_USER) {
            credentialsError = 'Mailgun credentials are not configured';
          }
          break;
      }
    }
    
    if (credentialsError && process.env.USE_MOCK_TRANSPORT !== 'true') {
      console.error(`❌ ${credentialsError}`);
      return res.status(500).json({
        error: 'Configuration error',
        message: `${credentialsError}. Please check environment variables.`
      });
    }
    
    // Handle file attachments
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype
      }));
      console.log(`📎 Processing ${attachments.length} attachments`);
    }

    // Set the from address (may depend on provider)
    let fromAddress = from;
    if (!fromAddress) {
      switch(selectedProvider) {
        case 'gmail':
          fromAddress = process.env.SMTP_USER;
          break;
        case 'sendgrid':
          fromAddress = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER;
          break;
        case 'mailgun':
          fromAddress = process.env.MAILGUN_FROM_EMAIL || process.env.MAILGUN_USER;
          break;
        case 'ethereal':
          fromAddress = 'colin.schroeder74@ethereal.email';
          break;
      }
    }
    
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
      attachments
    };
    
    try {
      console.log(`Attempting to send email via ${selectedProvider} with options:`, {
        from: fromAddress,
        to,
        subject,
        hasAttachments: attachments.length > 0,
        provider: selectedProvider
      });

      const info = await sendEmail(mailOptions, selectedProvider);
      console.log(`✅ Email sent successfully via ${selectedProvider}:`, info);
      
      // Check if this is a credentials unavailable response
      if (info.credentialsUnavailable) {
        return res.status(200).json({
          success: true,
          provider: selectedProvider,
          messageId: info.messageId,
          response: info.response,
          credentialsUnavailable: true,
          message: info.message
        });
      }
      
      // Create response, adding special properties for Ethereal
      const response = {
        success: true,
        provider: selectedProvider,
        messageId: info.messageId,
        response: info.response
      };
      
      // Add preview URL for Ethereal
      if (selectedProvider === 'ethereal' && info.previewUrl) {
        response.previewUrl = info.previewUrl;
      }
      
      return res.status(200).json(response);
    } catch (emailError) {
      console.error(`❌ Failed to send email via ${selectedProvider}:`, emailError);
      
      // Check for specific error types
      switch(emailError.code) {
        case 'EAUTH':
          return res.status(401).json({
            error: 'Authentication failed',
            message: `${selectedProvider} authentication failed. Please ensure you're using valid credentials.`
          });
        
        case 'ECONNECTION':
          return res.status(503).json({
            error: 'Connection error',
            message: `Could not connect to ${selectedProvider}. Please check server internet connection and provider status.`
          });
          
        case 'ETIMEDOUT':
          return res.status(504).json({
            error: 'Request timeout',
            message: `Connection to ${selectedProvider} timed out. Please try again later.`
          });
          
        default:
          return res.status(500).json({
            error: 'Email error',
            code: emailError.code || 'UNKNOWN',
            message: emailError.message || `An unknown error occurred while sending email via ${selectedProvider}`
          });
      }
    }
  } catch (error) {
    console.error('Controller error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message || 'An unexpected error occurred while processing your request'
    });
  }
}

export { sendEmailController }; 