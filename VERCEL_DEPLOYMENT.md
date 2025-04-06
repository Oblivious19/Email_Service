# Deploying to Vercel

This guide walks you through deploying the Managed Email Service to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. [Git](https://git-scm.com/) installed on your computer
3. Your project pushed to a GitHub, GitLab, or Bitbucket repository

## Deployment Steps

### 1. Prepare Your Repository

Make sure your project is committed to a Git repository and pushed to GitHub, GitLab, or Bitbucket.

### 2. Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Select the repository containing your Managed Email Service

### 3. Configure Project

In the configuration screen:

1. **Framework Preset**: Select "Other" 
2. **Build Command**: `npm install`
3. **Output Directory**: `public`
4. **Install Command**: `npm install`

### 4. Environment Variables

Add the following environment variables:

| Name | Value | Description |
|------|-------|-------------|
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_SECURE` | `false` | Whether to use TLS |
| `SMTP_USER` | Your Gmail or email address | Email user |
| `SMTP_PASS` | Your app password | Email password |
| `SENDGRID_API_KEY` | Your SendGrid API key | Optional, for SendGrid |
| `SENDGRID_FROM` | `noreply@yourdomain.com` | Optional, for SendGrid |
| `MAILGUN_API_KEY` | Your Mailgun API key | Optional, for Mailgun |
| `MAILGUN_DOMAIN` | `mail.yourdomain.com` | Optional, for Mailgun |
| `MAILGUN_FROM` | `mail@yourdomain.com` | Optional, for Mailgun |
| `NODE_ENV` | `production` | For production environment |

For preview deployments where you don't want to use real credentials, the application will automatically use a mock transport.

### 5. Deploy

Click "Deploy" and wait for the deployment to complete.

### 6. Test Your Deployment

Once deployed, Vercel will provide you with a URL to access your application. Visit this URL to test your deployment.

## Handling Preview Deployments

For preview deployments (such as from pull requests), you may not want to use real email credentials. The application will automatically detect Vercel preview deployments and use a mock email transport instead.

In preview deployments:
- Emails won't actually be sent
- The application will log the email content for debugging
- You'll see a success message, but no real email will be delivered

This behavior helps you test your application in preview environments without sending real emails.

## Troubleshooting

If you encounter issues with your deployment:

1. Check the Vercel deployment logs for errors
2. Ensure all environment variables are correctly set
3. Verify that your SMTP credentials are working
4. Test your application locally before deploying

For Gmail-specific issues, make sure you've:
- Enabled 2-Step Verification
- Generated an App Password
- Used the App Password in the `SMTP_PASS` environment variable

## Custom Domain

To use a custom domain:

1. Go to your project dashboard in Vercel
2. Click on "Domains"
3. Add your domain and follow the instructions to verify ownership
4. Update your DNS settings as instructed by Vercel

After the DNS propagates, your application will be accessible through your custom domain. 