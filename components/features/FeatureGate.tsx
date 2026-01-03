"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, Zap, HeadphonesIcon } from "lucide-react";
import { useSubscription } from "@/lib/hooks/useSubscription";
import UpgradeDialog from "@/components/billing/UpgradeDialog";
import { useState } from "react";

interface FeatureGateProps {
  featureName: string;
  description: string;
  requiredPlan?: "pro" | "enterprise";
  reason?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  compact?: boolean;
}

export default function FeatureGate({
  featureName,
  description,
  requiredPlan = "pro",
  reason,
  children,
  showIcon = true,
  compact = false,
}: FeatureGateProps) {
  const { isPro, isEnterprise, plan, loading } = useSubscription();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  // Check if user has access
  const hasAccess =
    requiredPlan === "pro"
      ? isPro || isEnterprise
      : isEnterprise;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show upgrade prompt
  if (compact) {
    return (
      <>
        <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {showIcon && <Lock className="h-4 w-4 text-gray-500" />}
            <span className="text-sm text-gray-400">{featureName} requires {requiredPlan === "enterprise" ? "Enterprise" : "Pro"}</span>
          </div>
          <Button
            onClick={() => setUpgradeDialogOpen(true)}
            size="sm"
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Upgrade to {requiredPlan === "enterprise" ? "Enterprise" : "Pro"}
          </Button>
        </div>
        <UpgradeDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          targetPlan={requiredPlan}
          reason={reason || `${featureName} is available for ${requiredPlan === "enterprise" ? "Enterprise" : "Pro"} subscribers.`}
        />
      </>
    );
  }

  return (
    <>
      <Card className="bg-gray-800 border-gray-700 border-yellow-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showIcon && (
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Lock className="h-5 w-5 text-yellow-500" />
                </div>
              )}
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  {featureName}
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                    {requiredPlan === "enterprise" ? "Enterprise" : "Pro"} Feature
                  </Badge>
                </CardTitle>
                <CardDescription className="text-gray-400 mt-1">
                  {description}
                </CardDescription>
              </div>
            </div>
            {requiredPlan === "enterprise" && isPro && (
              <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                <HeadphonesIcon className="h-3 w-3 mr-1" />
                Upgrade Available
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              {reason || `Unlock ${featureName} and other advanced features with ${requiredPlan === "enterprise" ? "Enterprise" : "Pro"} subscription.`}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {requiredPlan === "enterprise" ? "Enterprise" : "Pro"} Benefits
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {requiredPlan === "enterprise"
                      ? "Advanced features, API access, dedicated support"
                      : "Unlimited access, priority support, advanced analytics"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">Cancel Anytime</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    No long-term commitments
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setUpgradeDialogOpen(true)}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade to {requiredPlan === "enterprise" ? "Enterprise" : "Pro"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        targetPlan={requiredPlan}
        reason={reason || `${featureName} is available for ${requiredPlan === "enterprise" ? "Enterprise" : "Pro"} subscribers.`}
      />
    </>
  );
}

