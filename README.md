# Stock Tracker - Investment Portfolio Management Platform

A comprehensive stock market tracking and portfolio management application built with Next.js, featuring real-time market data, AI-powered insights, price alerts, and subscription-based premium features.

## 🚀 Features

- **Real-time Market Data**: Live stock prices and market updates via WebSocket
- **Portfolio Management**: Track holdings, performance, and asset allocation
- **Price Alerts**: Set custom alerts for price movements
- **Watchlist**: Monitor stocks you're interested in
- **AI-Powered Chat**: Get personalized investment insights (Pro/Enterprise)
- **News Aggregation**: Curated market news based on your portfolio and preferences
- **Multiple Authentication Methods**: Email/password and Google OAuth
- **Subscription Plans**: Free, Pro, and Enterprise tiers with different feature access

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MongoDB (local or Atlas)
- Accounts for:
  - Finnhub (free tier available)
  - Google Cloud Console (for OAuth)
  - Autumn (for billing)
  - Google AI Studio (for Gemini API)
  - Gmail (for email)

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd stock_webapp
npm install
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in all required environment variables. See **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** for detailed instructions on:
- Setting up Google OAuth
- Configuring MongoDB
- Obtaining API keys
- All other required variables

### 3. Database Setup

Ensure MongoDB is running and accessible. Update `MONGODB_URI` in `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/stock_tracker
```

### 4. Run Development Server

```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: WebSocket server (optional, for real-time features)
npm run ws:dev

# Terminal 3: Inngest (for background jobs)
npm run inngest:dev

# Or run all together
npm run dev:all
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📚 Documentation

- **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** - Complete environment variables guide and Google OAuth setup
- **[AUTUMN_SETUP.md](./AUTUMN_SETUP.md)** - Autumn billing integration guide
- **[WEBSOCKET_SETUP.md](./WEBSOCKET_SETUP.md)** - WebSocket server configuration

## 🏗️ Project Structure

```
stock_webapp/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages
│   ├── (root)/            # Protected routes
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities and services
│   ├── actions/          # Server actions
│   ├── services/         # Business logic services
│   └── hooks/            # Custom React hooks
├── database/             # Database models
└── types/                # TypeScript type definitions
```

## 🔐 Authentication

The application supports two authentication methods:

1. **Email/Password**: Traditional sign-up with OTP verification
2. **Google OAuth**: One-click sign-in with Google account

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for Google OAuth configuration.

## 💳 Subscription Plans

- **Free**: Basic features, limited stocks and alerts
- **Pro** ($9/month): Enhanced features, unlimited stocks/alerts, AI chat
- **Enterprise** ($29/month): All Pro features plus priority support

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB with Mongoose
- **Authentication**: Better Auth
- **Real-time**: WebSocket (ws)
- **Background Jobs**: Inngest
- **Billing**: Autumn.js
- **Email**: Nodemailer
- **SMS**: Twilio (optional)
- **AI**: Google Gemini
- **Stock Data**: Finnhub API

## 🐛 Troubleshooting

See the troubleshooting section in [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for common issues and solutions.

## 📝 License

[Your License Here]

## 🤝 Contributing

[Your Contributing Guidelines Here]
