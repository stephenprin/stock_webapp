"use server";

import { getUserSubscriptionPlan } from "@/lib/actions/user.actions";
import { getPortfolioHoldings } from "@/lib/actions/portfolio.actions";
import { connectToDatabase } from "@/database/mongoose";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { PriceAlertModel } from "@/database/models/price-alert.model";
import { ChatContext, PortfolioHoldingSummary } from "@/types/support-chat";

export async function buildSupportContext(): Promise<ChatContext | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return null;
    }

    const userId = session.user.id;
    
    const plan = await getUserSubscriptionPlan(userId);
    
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      return null;
    }

    const alertCount = await PriceAlertModel.countDocuments({ 
      userId,
      triggeredAt: null 
    });

    const portfolioResult = await getPortfolioHoldings();
    const portfolioHoldings: PortfolioHoldingSummary[] = portfolioResult.success && portfolioResult.holdings
      ? portfolioResult.holdings.map((h: any) => ({
          symbol: h.symbol,
          quantity: h.quantity,
          averageCost: h.averageCost,
          currentPrice: h.currentPrice,
          marketValue: h.marketValue,
          gainLoss: h.gainLoss,
          gainLossPercent: h.gainLossPercent,
          sector: h.sector,
          industry: h.industry,
        }))
      : [];

    const portfolioSummary = portfolioResult.success && portfolioResult.summary
      ? {
          totalValue: portfolioResult.summary.totalValue,
          totalCost: portfolioResult.summary.totalCost,
          totalGainLoss: portfolioResult.summary.totalGainLoss,
          totalGainLossPercent: portfolioResult.summary.totalGainLossPercent,
        }
      : undefined;

    const faqKnowledge = getFAQKnowledge();

    return {
      subscriptionPlan: plan,
      portfolioHoldingsCount: portfolioHoldings.length,
      portfolioHoldings,
      portfolioTotalValue: portfolioSummary?.totalValue,
      portfolioTotalCost: portfolioSummary?.totalCost,
      portfolioTotalGainLoss: portfolioSummary?.totalGainLoss,
      portfolioTotalGainLossPercent: portfolioSummary?.totalGainLossPercent,
      activeAlertsCount: alertCount,
      faqKnowledge,
    };
  } catch (error) {
    return null;
  }
}

function getFAQKnowledge(): string {
  return `FREQUENTLY ASKED QUESTIONS (FAQ) - Stock Tracker Platform

GETTING STARTED:
Q: How do I create an account?
A: Creating an account is simple and free! Click the "Sign Up" button on the homepage, enter your email address and create a password. You'll receive an OTP (One-Time Password) via email to verify your account. Once verified, you can start tracking stocks immediately.

Q: Why do I need to verify my email with OTP?
A: Email verification via OTP ensures the security of your account and confirms that you have access to the email address you provided. This helps protect your account from unauthorized access and ensures you receive important notifications about your stocks and alerts.

Q: What should I do after creating my account?
A: After verifying your email, we recommend: 1) Add stocks to your watchlist using the Search feature, 2) Create price alerts for stocks you're monitoring, 3) Start building your portfolio by adding positions, 4) Explore the dashboard to see market overview and trends.

ACCOUNT & AUTHENTICATION:
Q: How do I reset my password?
A: If you've forgotten your password, click "Forgot Password" on the sign-in page. You'll receive an email with instructions to reset your password. If you don't receive the email, check your spam folder or contact support.

Q: Can I change my email address?
A: Currently, email changes require contacting our support team. We're working on adding self-service email change functionality. For now, please reach out through the support channels if you need to update your email address.

Q: How secure is my account?
A: We take security seriously. Your password is encrypted and never stored in plain text. We use industry-standard authentication practices including OTP verification for email confirmation. We recommend using a strong, unique password and never sharing your account credentials.

PORTFOLIO MANAGEMENT:
Q: How do I add a stock to my portfolio?
A: To add a stock position to your portfolio: 1) Navigate to the Portfolio page, 2) Click the "Add Position" button, 3) Search for the stock symbol (e.g., AAPL for Apple), 4) Enter the quantity, price, and date of purchase, 5) Optionally add fees and notes, 6) Click "Add Position" to save.

Q: Can I edit or remove positions from my portfolio?
A: Yes! You can edit or remove any position in your portfolio. Click the menu icon (three dots) next to any position in your portfolio table to access options for editing the position, selling shares, or removing it entirely.

Q: Are there limits on how many stocks I can track?
A: Free plan users can track up to 5 unique stocks in their portfolio. Pro and Enterprise plans have unlimited stock tracking. You can upgrade your plan at any time from the Settings page or by clicking the "Upgrade" button when you reach your limit.

Q: What portfolio analytics are available?
A: Pro and Enterprise users have access to enhanced portfolio analytics including diversification score, portfolio concentration metrics, average return calculations, sector allocation charts, and top/worst performers analysis. Free users can see basic portfolio value and gain/loss information.

PRICE ALERTS:
Q: How do I create a price alert?
A: To create a price alert: 1) Search for a stock or navigate to a stock's detail page, 2) Click "Create Alert", 3) Choose your alert type (price threshold or percentage change), 4) Set your target price or percentage, 5) Select notification preferences, 6) Click "Create Alert". You'll be notified via email, push notification, or SMS (for Pro users) when your alert triggers.

Q: How many alerts can I create?
A: Free plan users can create up to 5 price alerts. Pro and Enterprise plans include unlimited alerts. You can upgrade your plan to get unlimited alerts.

Q: Can I edit or delete my alerts?
A: Yes, you can edit or delete any alert from the Alerts page. Click the menu icon next to an alert to access edit or delete options.

Q: What types of alerts are available?
A: Basic alerts include price threshold alerts (above/below a certain price). Pro and Enterprise users can create advanced alerts including percentage change alerts, volume alerts, and technical indicator alerts.

SUBSCRIPTION & PLANS:
Q: What are the differences between Free, Pro, and Enterprise plans?
A: 
- Free Plan: Track up to 5 stocks, create up to 5 alerts, basic portfolio view, standard news priority, basic alert types
- Pro Plan: Unlimited stocks and alerts, real-time market data via WebSocket, enhanced portfolio analytics, priority news, advanced alert types, SMS/WhatsApp notifications, priority support
- Enterprise Plan: All Pro features plus API access, multiple portfolios, team collaboration, dedicated support, custom integrations

Q: How do I upgrade my subscription?
A: You can upgrade your subscription from the Settings page. Click on "Billing" or "Subscription" section and select the plan you want. You'll be redirected to a secure payment page to complete your upgrade.

Q: Can I cancel my subscription?
A: Yes, you can cancel your subscription at any time from the Settings page. Your subscription will remain active until the end of your current billing period, and you'll retain access to Pro/Enterprise features until then.

REAL-TIME DATA:
Q: What is real-time market data?
A: Real-time market data provides live stock prices and market updates as they happen, updated every 60 seconds. This feature is available to Pro and Enterprise users and requires a WebSocket connection.

Q: Why is real-time data only available to Pro/Enterprise users?
A: Real-time data requires significant server resources and API costs. Pro and Enterprise plans help cover these costs while providing premium features to paying users.

NOTIFICATIONS:
Q: How do I enable SMS/WhatsApp notifications?
A: SMS and WhatsApp notifications are available to Pro and Enterprise users. Enable them from the Settings page under "Notifications". You'll need to add your phone number first.

Q: Can I disable notifications?
A: Yes, you can customize your notification preferences in Settings. You can disable email, push, or SMS/WhatsApp notifications individually.

SUPPORT:
Q: How do I contact support?
A: Free users can reach out via email at support@stocktracker.com or visit our support page for FAQs. Pro users receive priority support with faster response times. Enterprise users have dedicated support with direct team access.

Q: What is priority support?
A: Priority support is available to Pro and Enterprise users. Pro users receive faster response times and priority ticket handling. Enterprise users have dedicated support with direct access to our support team and custom contact information.`;
}

