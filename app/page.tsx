"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Bell,
  LineChart,
  DollarSign,
  AlertCircle,
  Check,
  ArrowRight,
  Sparkles,
  Users,
  Activity,
  Globe,
  Zap,
  Target,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/actions/auth.actions";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    name: "Real-Time Prices",
    icon: LineChart,
    description: "Track live stock prices and market movements",
    color: "text-green-500",
  },
  {
    name: "Smart Alerts",
    icon: Bell,
    description: "Get notified when stocks hit your target prices",
    color: "text-yellow-500",
  },
  {
    name: "Market News",
    icon: Activity,
    description: "Stay informed with personalized daily news summaries",
    color: "text-blue-500",
  },
  {
    name: "Watchlists",
    icon: Target,
    description: "Organize and monitor your favorite stocks",
    color: "text-purple-500",
  },
  {
    name: "Analytics",
    icon: BarChart3,
    description: "Deep insights into stock performance and trends",
    color: "text-orange-500",
  },
  {
    name: "Portfolio",
    icon: Shield,
    description: "Secure tracking of your investments",
    color: "text-cyan-500",
  },
];

const stats = [
  { value: "10,000+", label: "Stocks Tracked", icon: Globe },
  { value: "Real-Time", label: "Market Data", icon: Zap },
  { value: "50,000+", label: "Active Users", icon: Users },
  { value: "24/7", label: "Monitoring", icon: Activity },
];

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description:
      "Sign up in seconds. No credit card required. Start tracking stocks immediately.",
  },
  {
    number: "02",
    title: "Build Your Watchlist",
    description:
      "Add stocks you care about. Get real-time price updates and personalized alerts.",
  },
  {
    number: "03",
    title: "Stay Informed",
    description:
      "Receive daily news summaries and instant alerts when your stocks move.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    features: [
      "Track up to 10 stocks",
      "Basic price alerts",
      "Daily news summaries",
      "Real-time market data",
      "Community support",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: 9,
    description: "For serious investors",
    features: [
      "Unlimited stock tracking",
      "Advanced price alerts",
      "Priority news summaries",
      "Real-time market data",
      "Portfolio analytics",
      "Email & SMS alerts",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: 29,
    description: "For professional traders",
    features: [
      "Everything in Pro",
      "API access",
      "Custom integrations",
      "Advanced analytics",
      "Multiple portfolios",
      "Team collaboration",
      "Dedicated support",
      "Custom alerts & workflows",
    ],
    popular: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await getSession();
        setIsAuthenticated(!!result.user);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleGetStarted = () => {
    // Navigate to dashboard - (root) layout will redirect to sign-in if not authenticated
    router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        <div className="container relative mx-auto px-4 pt-32 pb-20 md:pt-40 md:pb-28">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Free to start • Real-time market data • No credit card required
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1] text-foreground"
            >
              Track Your Stocks
              <br />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-primary"
              >
                Like a Pro
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl leading-relaxed"
            >
              Real-time stock tracking, smart alerts, and personalized insights.
              <br className="hidden md:block" />
              Stay ahead of the market with instant notifications and daily news
              summaries.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start gap-4 mb-16"
            >
              {!isAuthenticated && (
                <Button
                  size="lg"
                  className="text-base px-8 h-12"
                  onClick={() => router.push("/sign-up")}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              <Button
                size="lg"
                variant={isAuthenticated ? "default" : "outline"}
                className="text-base px-8 h-12"
                onClick={handleGetStarted}
              >
                Track Your Stocks
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col gap-2"
                >
                  <stat.icon className="w-5 h-5 text-muted-foreground mb-1" />
                  <div className="text-3xl md:text-4xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center text-foreground">
            Everything You Need to Track Stocks
          </h2>
          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
            Powerful features to help you make informed investment decisions and
            never miss important market movements.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 max-w-6xl mx-auto"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.name}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative p-6 rounded-2xl border bg-card hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-4 ${feature.color}`}
              >
                <feature.icon className="w-6 h-6" />
              </motion.div>
              <h3 className="font-semibold text-base mb-1 text-foreground">
                {feature.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="border-y bg-muted/30 py-24 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center text-foreground">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
              Getting started is easy. You'll be tracking your first stock in
              minutes.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: index * 0.2,
                      type: "spring",
                      stiffness: 200,
                    }}
                    className="relative mb-6"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                    />
                    <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary text-2xl font-bold border-2 border-primary/20">
                      {step.number}
                    </div>
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center text-foreground">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
            Choose the plan that fits your investment needs. All plans include real-time market data.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {pricingPlans.map((plan, index) => {
            const isPopular = plan.popular;

            return (
              <motion.div
                key={plan.name}
                variants={itemVariants}
                whileHover={{ y: -8, scale: isPopular ? 1.03 : 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card
                  className={`relative transition-all duration-300 ${
                    isPopular
                      ? "border-primary/50 shadow-xl ring-2 ring-primary/20"
                      : "hover:shadow-lg hover:border-primary/30"
                  }`}
                >
                  {isPopular && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                      className="absolute -top-3 left-1/2 -translate-x-1/2"
                    >
                      <Badge className="px-3 py-1 text-xs font-semibold">
                        Most Popular
                      </Badge>
                    </motion.div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-bold text-foreground">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-5xl font-bold text-foreground">
                        ${plan.price}
                      </span>
                      <span className="text-muted-foreground ml-1">/month</span>
                    </div>
                    <ul className="space-y-3 text-left">
                      {plan.features.map((feature, featureIndex) => (
                        <motion.li
                          key={feature}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + featureIndex * 0.1 }}
                          className="flex items-start gap-3 text-sm"
                        >
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-foreground">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-4">
                    {!isAuthenticated ? (
                      <Button
                        className="w-full h-11"
                        variant={isPopular ? "default" : "outline"}
                        onClick={() => router.push("/sign-up")}
                      >
                        Get Started
                      </Button>
                    ) : (
                      <Button
                        className="w-full h-11"
                        variant={isPopular ? "default" : "outline"}
                        onClick={handleGetStarted}
                      >
                        {plan.price === 0 ? "Start Tracking" : "Upgrade Plan"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-12"
        >
          All plans include real-time market data. Cancel anytime. No commitment.
        </motion.p>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden border-y bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />

        <motion.div
          animate={{
            background: [
              "radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)",
              "radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.15),transparent_70%)",
              "radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute inset-0"
        />

        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              Ready to Track Your Stocks?
            </h2>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of investors who stay ahead of the market with
              real-time tracking and smart alerts. Start tracking your stocks
              today.
            </p>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {!isAuthenticated ? (
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-base px-8 h-12 font-semibold"
                  onClick={() => router.push("/sign-up")}
                >
                  Get Started Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-base px-8 h-12 font-semibold"
                  onClick={handleGetStarted}
                >
                  Track Your Stocks
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm opacity-90"
            >
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>Free to start</span>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>Real-time data</span>
              </motion.div>
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                <span>No credit card</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <Link
                href="/"
                className="hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/sign-up"
                className="hover:text-foreground transition-colors"
              >
                Sign Up
              </Link>
              <Link
                href="/sign-in"
                className="hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Signalist. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

