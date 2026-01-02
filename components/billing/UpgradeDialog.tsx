"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { toast } from "sonner";
import { PLAN_FEATURES } from "@/lib/constants";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPlan?: "pro" | "enterprise";
  reason?: string;
}

export default function UpgradeDialog({
  open,
  onOpenChange,
  targetPlan = "pro",
  reason,
}: UpgradeDialogProps) {
  const { plan, upgrade, loading: subscriptionLoading } = useSubscription();
  const [upgrading, setUpgrading] = useState(false);

  const planInfo = PLAN_FEATURES[targetPlan];
  const currentPlanInfo = (plan === "pro" || plan === "enterprise") ? PLAN_FEATURES[plan] : null;
  const isAlreadyOnPlan = plan === targetPlan || 
    (targetPlan === "pro" && plan === "enterprise");
  const isUpgrading = (plan === "pro" && targetPlan === "enterprise");

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      const successUrl = `${window.location.origin}/portfolio?upgraded=true`;
      const result = await upgrade({ productId: targetPlan, successUrl });
    
      if (result && typeof result === 'object') {
        if ('error' in result && result.error) {
          toast.error("Unable to start upgrade. Please try again or contact support.");
          return;
        }
        
        if ('data' in result && result.data) {
          const data = result.data as any;
        
          if (data.checkout_url && typeof data.checkout_url === 'string') {
            toast.success(`Almost there! Taking you to secure checkout...`);
            setTimeout(() => {
              window.location.href = data.checkout_url;
            }, 600);
            return;
          }
          
          toast.success(`Successfully upgraded to ${planInfo.name}!`);
          onOpenChange(false);
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          return;
        }
      }
      
      toast.success(`Upgrade initiated for ${planInfo.name}!`);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Upgrade error:", error);
      toast.error("Unable to start upgrade. Please try again or contact support.");
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isAlreadyOnPlan 
              ? "You're already on this plan" 
              : isUpgrading 
                ? `Upgrade from ${currentPlanInfo?.name || "Current Plan"} to ${planInfo.name}`
                : `Upgrade to ${planInfo.name}`
            }
          </DialogTitle>
          <DialogDescription>
            {reason || (
              isUpgrading 
                ? `Switch to ${planInfo.name} and unlock additional features. Your billing will be prorated.`
                : `Unlock all ${planInfo.name} features and take your stock tracking to the next level.`
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {reason && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">{reason}</p>
            </div>
          )}

          {!isAlreadyOnPlan && (
            <>
              {isUpgrading && currentPlanInfo && (
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Plan:</span>
                    <span className="text-sm font-medium">{currentPlanInfo.name} - {currentPlanInfo.price}/{currentPlanInfo.period.split(" ")[2]}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">New Plan:</span>
                    <span className="text-sm font-medium text-primary">{planInfo.name} - {planInfo.price}/{planInfo.period.split(" ")[2]}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-xs text-muted-foreground">
                      💡 Your billing will be automatically prorated. You'll only pay the difference for the remaining billing period.
                    </p>
                  </div>
                </div>
              )}

              {!isUpgrading && (
                <div className="text-center">
                  <div className="text-4xl font-bold">{planInfo.price}</div>
                  <div className="text-sm text-muted-foreground">{planInfo.period}</div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">
                  {isUpgrading ? `What you'll get with ${planInfo.name}:` : "What's included:"}
                </h4>
                <ul className="space-y-2">
                  {planInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {isAlreadyOnPlan && (
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                You're already subscribed to {plan === "enterprise" ? "Enterprise" : "Pro"} plan.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            {isAlreadyOnPlan ? "Close" : "Cancel"}
          </Button>
          {!isAlreadyOnPlan && (
            <Button
              onClick={handleUpgrade}
              disabled={upgrading || subscriptionLoading}
              className="flex-1"
            >
              {upgrading 
                ? "Processing..." 
                : isUpgrading 
                  ? `Switch to ${planInfo.name}`
                  : `Upgrade to ${planInfo.name}`
              }
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

