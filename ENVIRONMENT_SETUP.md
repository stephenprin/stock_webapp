# Environment Variables Setup Guide

This guide covers all environment variables required for the Stock Tracker application, including Google OAuth setup instructions.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in all required environment variables (see sections below)

3. Restart your development server

## Required Environment Variables

### 🔐 Authentication (Better Auth)

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=your_secret_key_here_min_32_characters
BETTER_AUTH_URL=http://localhost:3000/api/auth

# Public Better Auth URL (for client-side) - Optional, not typically needed
# NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000/api/auth
```

**How to generate `BETTER_AUTH_SECRET`:**
```bash
# Option 1: Use openssl
openssl rand -base64 32

# Option 2: Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 🔵 Google OAuth Setup

```env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Step-by-Step Google OAuth Configuration:

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Click "Select a project" → "New Project"
   - Enter project name (e.g., "Stock Tracker")
   - Click "Create"

2. **Enable Google+ API**
   - In Google Cloud Console, go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - If prompted, configure OAuth consent screen first:
     - Choose "External" (unless you have Google Workspace)
     - Fill in required fields:
       - App name: "Stock Tracker"
       - User support email: your email
       - Developer contact email: your email
     - Add scopes: `openid`, `email`, `profile`
     - Add test users (for testing before verification)
     - Save and continue

4. **Create OAuth Client ID**
   - Application type: "Web application"
   - Name: "Stock Tracker Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
   - Click "Create"

5. **Copy Credentials**
   - Copy the "Client ID" → set as `GOOGLE_CLIENT_ID`
   - Copy the "Client secret" → set as `GOOGLE_CLIENT_SECRET`
   - Add both to your `.env.local` file

6. **Verify Setup**
   - Restart your development server
   - Try signing up/signing in with Google
   - Check browser console for any errors

**Note:** For production, you'll need to:
- Verify your OAuth consent screen (if using external users)
- Add your production domain to authorized origins/redirects
- Consider using environment-specific credentials

### 🗄️ Database (MongoDB)

```env
MONGODB_URI=mongodb://localhost:27017/stock_tracker
# Or for MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stock_tracker?retryWrites=true&w=majority
```

**Setup Options:**
- **Local MongoDB**: Install MongoDB locally and use `mongodb://localhost:27017/stock_tracker`
- **MongoDB Atlas**: Create free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas), get connection string

### 📊 Stock Data (Finnhub API)

```env
# Server-side API key (preferred)
FINNHUB_API_KEY=your_finnhub_api_key

# Or client-side API key (if needed)
NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_api_key
```

**How to get Finnhub API key:**
1. Go to [finnhub.io](https://finnhub.io/)
2. Sign up for a free account
3. Go to "Dashboard" → copy your API key
4. Free tier includes 60 API calls/minute

### 💰 Billing (Autumn)

```env
AUTUMN_SECRET_KEY=your_autumn_secret_key
```

**Setup:**
1. Create account at [useautumn.com](https://useautumn.com/)
2. Connect Stripe account
3. Create products in Autumn dashboard:
   - Pro Plan: $9/month
   - Enterprise Plan: $29/month
4. Get API key from Developer → API Keys
5. See `AUTUMN_SETUP.md` for detailed instructions

### 📧 Email (Nodemailer)

```env
NODEMAILER_EMAIL=your_email@gmail.com
NODEMAILER_PASSWORD=your_app_password
```

**Gmail Setup:**
1. Enable 2-Step Verification on your Google account
2. Go to [Google Account Security](https://myaccount.google.com/security)
3. Under "2-Step Verification", click "App passwords"
4. Generate an app password for "Mail"
5. Use this app password (not your regular Gmail password)

**Note:** For production, consider using a service like SendGrid, Mailgun, or AWS SES.

### 🤖 AI (Google Gemini)

```env
GEMINI_API_KEY=your_gemini_api_key
```

**Setup:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Copy and add to `.env.local`

### 📱 SMS Notifications (Twilio) - Optional

```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
USE_WHATSAPP=false
```

**Setup:**
1. Create account at [twilio.com](https://www.twilio.com/)
2. Get Account SID and Auth Token from dashboard
3. Purchase a phone number (or use trial number)
4. For WhatsApp, enable Twilio WhatsApp Sandbox

### 🔔 Push Notifications (Web Push) - Optional

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your_email@example.com
```

**Generate VAPID Keys:**
```bash
# Install web-push CLI
npm install -g web-push

# Generate keys
web-push generate-vapid-keys
```

Copy the public key to `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and private key to `VAPID_PRIVATE_KEY`.

### 🌐 Application URL

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For Production:**
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Complete .env.local Example

```env
# Authentication
BETTER_AUTH_SECRET=your_32_character_secret_key_here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database
MONGODB_URI=mongodb://localhost:27017/stock_tracker

# Stock Data API
FINNHUB_API_KEY=your_finnhub_api_key

# Billing
AUTUMN_SECRET_KEY=your_autumn_secret_key

# Email
NODEMAILER_EMAIL=your_email@gmail.com
NODEMAILER_PASSWORD=your_app_password

# AI
GEMINI_API_KEY=your_gemini_api_key

# SMS (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
USE_WHATSAPP=false

# Push Notifications (Optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your_email@example.com

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Verification Checklist

Before running the application, verify:

- [ ] `BETTER_AUTH_SECRET` is at least 32 characters
- [ ] `BETTER_AUTH_URL` matches your development URL
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set (if using Google OAuth)
- [ ] Google OAuth redirect URI matches your callback URL
- [ ] `MONGODB_URI` is valid and database is accessible
- [ ] `FINNHUB_API_KEY` is valid
- [ ] `NODEMAILER_EMAIL` and `NODEMAILER_PASSWORD` are set (for email features)
- [ ] `GEMINI_API_KEY` is set (for AI features)

## Troubleshooting

### Google OAuth Issues

**Error: "redirect_uri_mismatch"**
- Ensure redirect URI in Google Console matches: `http://localhost:3000/api/auth/callback/google`
- Check for trailing slashes and http vs https

**Error: "invalid_client"**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Ensure OAuth consent screen is configured

**OAuth not showing in UI**
- Check that both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Restart development server after adding variables

### Database Connection Issues

**Error: "MongoDB connection not found"**
- Verify `MONGODB_URI` is correct
- Check MongoDB is running (for local) or network access (for Atlas)
- Ensure database credentials are correct

### Email Not Sending

**Error: "Invalid login"**
- Use App Password, not regular Gmail password
- Ensure 2-Step Verification is enabled
- Verify `NODEMAILER_EMAIL` matches the Google account

## Security Notes

- ⚠️ **Never commit `.env.local` to version control**
- ✅ `.env.local` is already in `.gitignore`
- ✅ Use different credentials for development and production
- ✅ Rotate secrets regularly in production
- ✅ Use environment-specific OAuth credentials

## Additional Resources

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [MongoDB Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [Finnhub API Documentation](https://finnhub.io/docs/api)

