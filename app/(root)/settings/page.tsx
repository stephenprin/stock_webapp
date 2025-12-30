"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Settings, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Sparkles,
  TrendingUp,
  Loader2
} from "lucide-react";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { PLAN_FEATURES } from "@/lib/constants";
import SubscriptionBadge from "@/components/billing/SubscriptionBadge";
import UpgradeDialog from "@/components/billing/UpgradeDialog";
import { toast } from "sonner";
import { formatCurrency, formatPercent } from "@/lib/utils/utils";

export default function SettingsPage() {
  const { plan, customer, isFree, isPro, isEnterprise, openBillingPortal, loading } = useSubscription();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<"pro" | "enterprise">("pro");
  const [openingPortal, setOpeningPortal] = useState(false);

  const planInfo = plan !== "free" ? PLAN_FEATURES[plan] : null;
  const nextPlan = isFree ? "pro" : isPro ? "enterprise" : null;

  const handleOpenBillingPortal = async () => {
    try {
      setOpeningPortal(true);
      const result = await openBillingPortal({ 
        returnUrl: `${window.location.origin}/settings`,
        openInNewTab: false 
      });
      
      if (result && typeof result === 'object' && 'data' in result && result.data) {
        const data = result.data as any;
        if (data.url) {
          window.location.href = data.url;
        } else {
          toast.error("Unable to open billing portal. Please try again.");
        }
      } else if (result && typeof result === 'object' && 'error' in result && result.error) {
        toast.error("Unable to open billing portal. Please try again.");
      }
    } catch (error) {
      console.error("Error opening billing portal:", error);
      toast.error("Unable to open billing portal. Please try again.");
    } finally {
      setOpeningPortal(false);
    }
  };

  const handleUpgradeClick = (plan: "pro" | "enterprise") => {
    setTargetPlan(plan);
    setUpgradeDialogOpen(true);
  };

  // Get active product subscription details
  const activeProduct = customer?.products?.find(
    p => (p.status === "active" || p.status === "trialing") && 
    (p.id === "pro_plan" || p.id === "enterprise_plan")
  );

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>
        <p className="text-gray-400">Manage your account and subscription</p>
      </div>

      {/* Subscription Section */}
      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription & Billing
              </CardTitle>
              <CardDescription className="text-gray-400 mt-1">
                Manage your subscription plan and billing information
              </CardDescription>
            </div>
            <SubscriptionBadge />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Plan */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Current Plan</h3>
            <div className="rounded-lg bg-gray-700/50 p-4 border border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-semibold text-white">
                      {planInfo?.name || "Free"}
                    </span>
                    {activeProduct?.status === "trialing" && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                        Trial
                      </Badge>
                    )}
                    {activeProduct?.status === "active" && (
                      <Badge variant="outline" className="border-green-500 text-green-500">
                        Active
                      </Badge>
                    )}
                  </div>
                  {planInfo && (
                    <p className="text-sm text-gray-400">
                      {planInfo.price} {planInfo.period}
                    </p>
                  )}
                  {!planInfo && (
                    <p className="text-sm text-gray-400">No active subscription</p>
                  )}
                </div>
                {nextPlan && (
                  <Button
                    onClick={() => handleUpgradeClick(nextPlan)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isPro ? "Switch to Enterprise" : "Upgrade to Pro"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          {activeProduct && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Subscription Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Status:</span>
                  <span className={activeProduct.status === "active" ? "text-green-500" : "text-yellow-500"}>
                    {activeProduct.status === "active" ? "Active" : "Trial"}
                  </span>
                </div>
                {activeProduct.next_cycle_at && (
                  <div className="flex justify-between text-gray-400">
                    <span>Next billing date:</span>
                    <span className="text-white">{formatDate(activeProduct.next_cycle_at)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Billing Management */}
          <div className="border-t border-gray-700 pt-6" />
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Billing Management</h3>
            <p className="text-sm text-gray-400 mb-4">
              Update your payment method, view invoices, and manage your subscription through Stripe's secure billing portal.
            </p>
            <Button
              onClick={handleOpenBillingPortal}
              disabled={openingPortal || loading || isFree}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {openingPortal ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {isFree ? "Billing Portal (Requires Active Subscription)" : "Open Billing Portal"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan Features Comparison */}
      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Available Plans
          </CardTitle>
          <CardDescription className="text-gray-400">
            Compare features across our plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Free Plan */}
            <div className={`rounded-lg border-2 p-4 ${
              plan === "free" 
                ? "border-yellow-500 bg-yellow-500/10" 
                : "border-gray-700 bg-gray-700/30"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white">Free</h4>
                {plan === "free" && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                    Current
                  </Badge>
                )}
              </div>
              <div className="text-2xl font-bold text-white mb-1">$0</div>
              <div className="text-sm text-gray-400 mb-4">Forever</div>
              <ul className="space-y-2 text-sm text-gray-400 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Up to 10 stocks
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Basic price alerts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Daily news summaries
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Real-time market data
                </li>
              </ul>
              {plan === "free" && (
                <Button
                  onClick={() => handleUpgradeClick("pro")}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900"
                >
                  Upgrade to Pro
                </Button>
              )}
            </div>

            {/* Pro Plan */}
            <div className={`rounded-lg border-2 p-4 ${
              plan === "pro" 
                ? "border-yellow-500 bg-yellow-500/10" 
                : "border-gray-700 bg-gray-700/30"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white">Pro</h4>
                {plan === "pro" && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                    Current
                  </Badge>
                )}
              </div>
              <div className="text-2xl font-bold text-white mb-1">$9</div>
              <div className="text-sm text-gray-400 mb-4">per month</div>
              <ul className="space-y-2 text-sm text-gray-400 mb-4">
                {PLAN_FEATURES.pro.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan !== "pro" && plan !== "enterprise" && (
                <Button
                  onClick={() => handleUpgradeClick("pro")}
                  variant="outline"
                  className="w-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                >
                  {plan === "free" ? "Upgrade" : "Switch"}
                </Button>
              )}
            </div>

            {/* Enterprise Plan */}
            <div className={`rounded-lg border-2 p-4 ${
              plan === "enterprise" 
                ? "border-purple-500 bg-purple-500/10" 
                : "border-gray-700 bg-gray-700/30"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white">Enterprise</h4>
                {plan === "enterprise" && (
                  <Badge variant="outline" className="border-purple-500 text-purple-500">
                    Current
                  </Badge>
                )}
              </div>
              <div className="text-2xl font-bold text-white mb-1">$20</div>
              <div className="text-sm text-gray-400 mb-4">per month</div>
              <ul className="space-y-2 text-sm text-gray-400 mb-4">
                {PLAN_FEATURES.enterprise.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan !== "enterprise" && (
                <Button
                  onClick={() => handleUpgradeClick("enterprise")}
                  variant="outline"
                  className="w-full border-purple-500 text-purple-500 hover:bg-purple-500/10"
                >
                  {plan === "free" ? "Upgrade" : "Switch"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        targetPlan={targetPlan}
      />
    </div>
  );
}

