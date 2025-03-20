# Vercel Deployment Guide

This guide will help you deploy your CPR booking application to Vercel successfully.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. A Stripe account with API keys
4. A SendGrid account with API key and verified sender email

## Deployment Steps

### 1. Connect Your Repository to Vercel

1. Log into your Vercel account
2. Click "Add New" -> "Project"
3. Import your Git repository
4. Select the CPR booking project

### 2. Configure Environment Variables

In the Vercel project settings, add the following environment variables:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NEXT_PUBLIC_BASE_URL` | Your domain (e.g., `https://anytimecpr.com`) | The public URL of your site |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Your Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Your Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Your Stripe webhook secret |
| `SENDGRID_API_KEY` | Your SendGrid API key | For sending emails |
| `SENDGRID_FROM_EMAIL` | Your verified sender email | The email address that sends confirmations |
| `SENDGRID_VERIFIED_SENDER` | Same as above | Should match your verified sender in SendGrid |
| `NEXTAUTH_SECRET` | Generate a secure random string | Security key for NextAuth.js |

### 3. Set Up Stripe Webhook

1. In your Stripe Dashboard, go to "Developers" -> "Webhooks"
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-domain.com/api/stripe/webhook`
4. Select the event `checkout.session.completed`
5. Retrieve the signing secret and add it as `STRIPE_WEBHOOK_SECRET` in your Vercel environment variables

### 4. Configure Build Settings (Optional)

In most cases, Vercel will automatically detect the correct build settings. However, if needed, you can configure:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### 5. Deploy

1. Click "Deploy"
2. Vercel will build and deploy your application
3. Once deployment is complete, Vercel will provide you with a URL to access your site

### 6. Test Your Deployment

1. Visit your deployed site
2. Make a test booking (use a small amount)
3. Verify that the confirmation email is sent correctly
4. Check your Stripe dashboard to confirm the payment was processed

### Troubleshooting

If you encounter any issues:

- Check Vercel logs for build or runtime errors
- Ensure all environment variables are set correctly
- Verify your Stripe webhook is properly configured
- Check SendGrid logs to confirm email delivery

### Production Considerations

- For a production environment, use Stripe's live mode keys
- Ensure your SendGrid sender email is verified
- Set up a custom domain for your Vercel deployment
- Configure proper error monitoring (Sentry, LogRocket, etc.)

## Regular Maintenance

- Keep your Node.js dependencies updated
- Monitor Stripe and SendGrid service status
- Set up Vercel alerts for deployment failures

If you need further assistance, please refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com/) 