# Managed-Email-Service

A modern email management service that allows users to send emails through various SMTP providers.

## Features

- Send emails with text, HTML, or markdown content
- Support for CC, BCC, and Reply-To fields
- File attachments
- Multiple SMTP provider options (Gmail, SendGrid, Mailgun)
- Preview mode before sending
- Modern, responsive UI with dark mode
- Mock transport option for development and preview environments
- Automatic fallback to mock transport when credentials are invalid
- Smart port selection to avoid conflicts

## Setup

### Install Dependencies

```bash
npm install
```

### Environment Variables

The application uses environment variables for SMTP configuration. Copy the `.env.example` file to create your own `.env` file:

```bash
cp .env.example .env
```

Then edit the `.env` file with your own SMTP credentials:

```
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM=noreply@yourdomain.com

# Mailgun Configuration
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mail.yourdomain.com
MAILGUN_FROM=mail@yourdomain.com
```

To check your environment configuration, run:

```bash
npm run check-env
```

This will show you which providers are properly configured and which are using placeholder values.

### For Gmail

To use Gmail as your SMTP provider, you need to:

1. Enable 2-Step Verification in your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use that App Password in the `SMTP_PASS` field

### For Vercel Deployment

When deploying to Vercel:

1. Add all the environment variables in your Vercel project settings
2. For preview deployments without real credentials, the application will automatically switch to a mock transport

For detailed deployment instructions, see [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

## Running the Application

```bash
# Start in development mode
npm run dev

# Start in production mode
npm start

# Check environment configuration
npm run check-env
```

The application will be available at http://localhost:3000 (or next available port if 3000 is in use)

## Error Handling

The application includes several features to handle common errors:

- If port 3000 is already in use, the server will automatically try the next available port
- If email provider credentials are invalid or not provided, it will automatically fall back to a mock transport
- Authentication errors with SendGrid or Mailgun will trigger a fallback to mock transport with a clear message
- The mock transport simulates email sending without actually sending emails, good for testing

## License

MIT
