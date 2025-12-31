"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import FAQSection, { type FAQItem } from "@/components/support/FAQSection";
import {
  HelpCircle,
  UserPlus,
  Shield,
  Bell,
  TrendingUp,
  Search,
  CreditCard,
  AlertCircle,
  Database,
  Mail,
  Lock,
  X,
} from "lucide-react";
import Link from "next/link";

type FAQCategory = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: FAQItem[];
};

const faqCategories: FAQCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: UserPlus,
    items: [
      {
        id: "how-to-sign-up",
        question: "How do I create an account?",
        answer: (
          <div className="space-y-2">
            <p>
              Creating an account is simple and free! Click the "Sign Up" button on the homepage,
              enter your email address and create a password. You'll receive an OTP (One-Time
              Password) via email to verify your account. Once verified, you can start tracking
              stocks immediately.
            </p>
          </div>
        ),
      },
      {
        id: "what-is-otp",
        question: "Why do I need to verify my email with OTP?",
        answer: (
          <div className="space-y-2">
            <p>
              Email verification via OTP ensures the security of your account and confirms that you
              have access to the email address you provided. This helps protect your account from
              unauthorized access and ensures you receive important notifications about your stocks
              and alerts.
            </p>
          </div>
        ),
      },
      {
        id: "first-steps",
        question: "What should I do after creating my account?",
        answer: (
          <div className="space-y-2">
            <p>After verifying your email, we recommend:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Add stocks to your watchlist using the Search feature</li>
              <li>Create price alerts for stocks you're monitoring</li>
              <li>Start building your portfolio by adding positions</li>
              <li>Explore the dashboard to see market overview and trends</li>
            </ol>
          </div>
        ),
      },
    ],
  },
  {
    id: "account",
    title: "Account & Authentication",
    icon: Shield,
    items: [
      {
        id: "forgot-password",
        question: "How do I reset my password?",
        answer: (
          <div className="space-y-2">
            <p>
              If you've forgotten your password, click "Forgot Password" on the sign-in page. You'll
              receive an email with instructions to reset your password. If you don't receive the
              email, check your spam folder or contact support.
            </p>
          </div>
        ),
      },
      {
        id: "change-email",
        question: "Can I change my email address?",
        answer: (
          <div className="space-y-2">
            <p>
              Currently, email changes require contacting our support team. We're working on adding
              self-service email change functionality. For now, please reach out through the support
              channels if you need to update your email address.
            </p>
          </div>
        ),
      },
      {
        id: "account-security",
        question: "How secure is my account?",
        answer: (
          <div className="space-y-2">
            <p>
              We take security seriously. Your password is encrypted and never stored in plain text.
              We use industry-standard authentication practices including OTP verification for email
              confirmation. We recommend using a strong, unique password and never sharing your
              account credentials.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    id: "portfolio",
    title: "Portfolio Management",
    icon: TrendingUp,
    items: [
      {
        id: "add-position",
        question: "How do I add a stock to my portfolio?",
        answer: (
          <div className="space-y-2">
            <p>
              To add a stock position to your portfolio:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Navigate to the Portfolio page</li>
              <li>Click the "Add Position" button</li>
              <li>Search for the stock symbol (e.g., AAPL for Apple)</li>
              <li>Enter the quantity, price, and date of purchase</li>
              <li>Optionally add fees and notes</li>
              <li>Click "Add Position" to save</li>
            </ol>
          </div>
        ),
      },
      {
        id: "edit-position",
        question: "Can I edit or remove positions from my portfolio?",
        answer: (
          <div className="space-y-2">
            <p>
              Yes! You can edit or remove any position in your portfolio. Click the menu icon (three
              dots) next to any position in your portfolio table to access options for editing the
              position, selling shares, or removing it entirely.
            </p>
          </div>
        ),
      },
      {
        id: "portfolio-limits",
        question: "Are there limits on how many stocks I can track?",
        answer: (
          <div className="space-y-2">
            <p>
              Free plan users can track up to 10 unique stocks in their portfolio. Pro and
              Enterprise plans have unlimited stock tracking. You can upgrade your plan at any time
              from the Settings page or by clicking the "Upgrade" button when you reach your limit.
            </p>
          </div>
        ),
      },
      {
        id: "portfolio-analytics",
        question: "What analytics are available for my portfolio?",
        answer: (
          <div className="space-y-2">
            <p>
              Portfolio analytics include:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Total portfolio value and cost basis</li>
              <li>Overall gain/loss and percentage returns</li>
              <li>Asset allocation charts showing distribution by stock</li>
              <li>Performance charts tracking value over time</li>
              <li>Individual position P&L calculations</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: "alerts",
    title: "Price Alerts",
    icon: Bell,
    items: [
      {
        id: "create-alert",
        question: "How do I create a price alert?",
        answer: (
          <div className="space-y-2">
            <p>
              You can create price alerts in two ways:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>
                From the Alerts page: Click "Create Alert", enter the stock symbol, set your target
                price, and choose "Upper" (price goes above) or "Lower" (price goes below)
              </li>
              <li>
                From a stock detail page: Click "Create Alert" button, which will pre-fill the
                symbol and company name
              </li>
            </ol>
            <p>
              Once created, you'll receive an email notification when the stock price reaches your
              target threshold.
            </p>
          </div>
        ),
      },
      {
        id: "alert-types",
        question: "What are Upper and Lower alerts?",
        answer: (
          <div className="space-y-2">
            <p>
              <strong>Upper alerts</strong> trigger when a stock's price rises to or above your
              target threshold. This is useful for taking profits or being notified of upward
              momentum.
            </p>
            <p>
              <strong>Lower alerts</strong> trigger when a stock's price drops to or below your
              target threshold. This is useful for buying opportunities or loss prevention.
            </p>
          </div>
        ),
      },
      {
        id: "alert-limits",
        question: "How many alerts can I create?",
        answer: (
          <div className="space-y-2">
            <p>
              Free plan users can create up to 5 active alerts. Pro and Enterprise plans include
              unlimited alerts. You can activate or deactivate alerts at any time without deleting
              them.
            </p>
          </div>
        ),
      },
      {
        id: "alert-notifications",
        question: "How will I be notified when an alert triggers?",
        answer: (
          <div className="space-y-2">
            <p>
              When a price alert triggers, you'll receive an email notification containing:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>The stock symbol and company name</li>
              <li>Current price and target price</li>
              <li>Alert type (upper or lower)</li>
              <li>Timestamp of when the alert was triggered</li>
            </ul>
            <p>
              Alerts are checked every 5 minutes, so you'll be notified shortly after the threshold
              is reached.
            </p>
          </div>
        ),
      },
      {
        id: "edit-alerts",
        question: "Can I edit or delete alerts?",
        answer: (
          <div className="space-y-2">
            <p>
              Yes! From the Alerts page, click the menu icon next to any alert to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Edit the alert name or threshold price</li>
              <li>Activate or deactivate the alert</li>
              <li>Delete the alert entirely</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: "subscriptions",
    title: "Subscriptions & Billing",
    icon: CreditCard,
    items: [
      {
        id: "pricing-plans",
        question: "What are the different subscription plans?",
        answer: (
          <div className="space-y-2">
            <p>
              We offer three plans:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong>Free:</strong> Track up to 10 stocks, 5 price alerts, daily news summaries,
                community support
              </li>
              <li>
                <strong>Pro ($9/month):</strong> Unlimited stocks and alerts, priority news,
                portfolio analytics, priority support
              </li>
              <li>
                <strong>Enterprise ($29/month):</strong> Everything in Pro plus API access, custom
                integrations, multiple portfolios, team collaboration, dedicated support
              </li>
            </ul>
          </div>
        ),
      },
      {
        id: "upgrade",
        question: "How do I upgrade my plan?",
        answer: (
          <div className="space-y-2">
            <p>
              To upgrade your plan:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Navigate to the Portfolio or Alerts page</li>
              <li>Click the "Upgrade" button</li>
              <li>Select your desired plan (Pro or Enterprise)</li>
              <li>Complete the checkout process with Stripe</li>
            </ol>
            <p>
              You can also manage your subscription from the Settings page.
            </p>
          </div>
        ),
      },
      {
        id: "cancel-subscription",
        question: "Can I cancel my subscription?",
        answer: (
          <div className="space-y-2">
            <p>
              Yes, you can cancel your subscription at any time from the Settings page. Your
              subscription will remain active until the end of your current billing period, and
              you'll continue to have access to all premium features until then. After cancellation,
              your account will revert to the Free plan.
            </p>
          </div>
        ),
      },
      {
        id: "payment-methods",
        question: "What payment methods are accepted?",
        answer: (
          <div className="space-y-2">
            <p>
              We accept all major credit cards and debit cards through our secure payment processor,
              Stripe. All payments are processed securely and we never store your full card details
              on our servers.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: AlertCircle,
    items: [
      {
        id: "data-not-loading",
        question: "Why isn't my stock data loading?",
        answer: (
          <div className="space-y-2">
            <p>
              If stock data isn't loading, try:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Refreshing the page</li>
              <li>Checking your internet connection</li>
              <li>Verifying the stock symbol is correct (use uppercase, e.g., AAPL)</li>
              <li>Waiting a few moments and trying again (market data may be temporarily
                unavailable)</li>
            </ul>
            <p>
              If the issue persists, the stock may not be available in our database or there may be
              a temporary service issue.
            </p>
          </div>
        ),
      },
      {
        id: "alert-not-triggering",
        question: "My alert didn't trigger, why?",
        answer: (
          <div className="space-y-2">
            <p>
              Alerts are checked every 5 minutes, so there may be a slight delay. Also, make sure:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>The alert is active (not deactivated)</li>
              <li>The threshold hasn't been reached yet</li>
              <li>Your email address is verified</li>
              <li>Check your spam folder for the notification email</li>
            </ul>
          </div>
        ),
      },
      {
        id: "portfolio-calculations",
        question: "Why don't my portfolio calculations match?",
        answer: (
          <div className="space-y-2">
            <p>
              Portfolio calculations are based on:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Current market prices (real-time or latest available)</li>
              <li>The quantity and average cost you entered for each position</li>
              <li>Any fees you've included in your transactions</li>
            </ul>
            <p>
              If calculations seem off, verify that you've entered the correct purchase prices,
              quantities, and dates. Also, ensure you're comparing to the same price point (e.g.,
              closing price vs. current price).
            </p>
          </div>
        ),
      },
    ],
  },
  {
    id: "general",
    title: "General Questions",
    icon: HelpCircle,
    items: [
      {
        id: "real-time-data",
        question: "Is the stock data real-time?",
        answer: (
          <div className="space-y-2">
            <p>
              We provide real-time market data during market hours. Outside of market hours, you'll
              see the latest closing price. Data is updated automatically as it becomes available
              from our data provider.
            </p>
          </div>
        ),
      },
      {
        id: "supported-markets",
        question: "Which stock markets are supported?",
        answer: (
          <div className="space-y-2">
            <p>
              We primarily support major US stock exchanges including NYSE and NASDAQ. We're
              continuously expanding our coverage to include more markets and exchanges.
            </p>
          </div>
        ),
      },
      {
        id: "contact-support",
        question: "How can I contact support?",
        answer: (
          <div className="space-y-2">
            <p>
              For questions not covered in this FAQ:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Free users:</strong> Community support via this FAQ and documentation
              </li>
              <li>
                <strong>Pro users:</strong> Priority email support (faster response times)
              </li>
              <li>
                <strong>Enterprise users:</strong> Dedicated support with direct access to our team
              </li>
            </ul>
            <p>
              For urgent issues, please check the troubleshooting section above or reach out through
              your account settings.
            </p>
          </div>
        ),
      },
      {
        id: "feature-requests",
        question: "Can I request new features?",
        answer: (
          <div className="space-y-2">
            <p>
              We'd love to hear your suggestions! While we don't have a formal feature request
              system yet, we're constantly working to improve the platform based on user feedback.
              Feel free to share your ideas through the support channels.
            </p>
          </div>
        ),
      },
    ],
  },
];

const extractTextFromNode = (node: React.ReactNode): string => {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) {
    return node.map(extractTextFromNode).join(" ");
  }
  if (node && typeof node === "object" && node !== null && "props" in node) {
    const props = (node as { props?: { children?: React.ReactNode } }).props;
    if (props?.children) {
      return extractTextFromNode(props.children);
    }
  }
  return "";
};

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    return faqCategories
      .map((category) => {
        if (!searchQuery.trim()) return category;

        const query = searchQuery.toLowerCase().trim();
        const filteredItems = category.items.filter((item) => {
          // Search in question
          const questionMatch = item.question.toLowerCase().includes(query);

          // Search in answer (extract text from React nodes)
          const answerText = extractTextFromNode(item.answer).toLowerCase();
          const answerMatch = answerText.includes(query);

          // Also search in category title for better discovery
          const categoryMatch = category.title.toLowerCase().includes(query);

          return questionMatch || answerMatch || categoryMatch;
        });

        return { ...category, items: filteredItems };
      })
      .filter((category) => category.items.length > 0);
  }, [searchQuery]);

  const displayedCategories = useMemo(() => {
    if (selectedCategory) {
      return filteredCategories.filter((cat) => cat.id === selectedCategory);
    }
    return filteredCategories;
  }, [filteredCategories, selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <HelpCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 px-2">
            Help & Support
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-6 sm:mb-8 px-4">
            Find answers to common questions and learn how to make the most of Stock Tracker
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for answers... (e.g., portfolio, alerts)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-12 pr-10 h-11 sm:h-12 text-sm sm:text-base bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 z-10"
                  aria-label="Clear search"
                  type="button"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 px-2 sm:px-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                selectedCategory === null
                  ? "bg-green-500 text-gray-900"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
              }`}
            >
              All Categories
            </button>
            {faqCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === category.id ? null : category.id
                    )
                  }
                  type="button"
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center gap-1.5 sm:gap-2 ${
                    selectedCategory === category.id
                      ? "bg-green-500 text-gray-900"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="whitespace-nowrap">{category.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-6 sm:space-y-8">
          {displayedCategories.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6 sm:pt-6 text-center px-4 sm:px-6">
                <p className="text-gray-400 text-sm sm:text-base">
                  {searchQuery.trim() ? (
                    <>
                      No results found for <strong className="text-white">"{searchQuery}"</strong>
                    </>
                  ) : (
                    "No FAQs found"
                  )}
                </p>
                {searchQuery.trim() && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    Try different keywords or{" "}
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory(null);
                      }}
                      className="text-green-500 hover:text-green-400 underline font-medium"
                    >
                      clear filters
                    </button>
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            displayedCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.id} className="bg-gray-800 border-gray-700">
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="flex items-center gap-2 sm:gap-3 text-white text-lg sm:text-xl">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 shrink-0" />
                      <span>{category.title}</span>
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-sm sm:text-base">
                      {category.items.length} question{category.items.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <FAQSection items={category.items} />
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Still Need Help Section */}
        <Card className="mt-8 sm:mt-12 bg-gray-800 border-gray-700">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-white text-lg sm:text-xl">Still Need Help?</CardTitle>
            <CardDescription className="text-gray-400 text-sm sm:text-base">
              Can't find what you're looking for?
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                If you're a <strong className="text-white">Pro</strong> or{" "}
                <strong className="text-white">Enterprise</strong> subscriber, you have access to
                priority support. Check your account settings for contact information.
              </p>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Free plan users can find additional help in our documentation and community
                resources.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-green-500 hover:bg-green-600 text-gray-900 font-medium rounded-lg transition-colors text-center text-sm sm:text-base"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/sign-in"
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors border border-gray-600 text-center text-sm sm:text-base"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

