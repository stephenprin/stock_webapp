"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getUserAlerts, type PriceAlertPlain } from "@/lib/actions/alerts.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, RefreshCw, Sparkles, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import AlertsList from "@/components/alerts/AlertsList";
import CreateAlertDialog from "@/components/alerts/CreateAlertDialog";
import SubscriptionBadge from "@/components/billing/SubscriptionBadge";
import UpgradeDialog from "@/components/billing/UpgradeDialog";
import { getCurrentUserSubscriptionPlan } from "@/lib/actions/subscription.actions";
import { getSubscriptionLimits } from "@/lib/utils/subscription";
import { Skeleton } from "@/components/ui/skeleton";
import type { SubscriptionPlan } from "@/database/models/user-subscription.model";

export default function AlertsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [alerts, setAlerts] = useState<PriceAlertPlain[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [plan, setPlan] = useState<SubscriptionPlan>("free");
  const [planLoading, setPlanLoading] = useState(true);
  const [alertLimit, setAlertLimit] = useState<number | null>(null);

  const isFree = plan === "free";
  const isPro = plan === "pro";
  const isEnterprise = plan === "enterprise";

  useEffect(() => {
    const upgraded = searchParams.get("upgraded");
    if (upgraded === "true") {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      
      toast.success("Upgrade successful! Your subscription is now active.", {
        duration: 5000,
      });
      
      const reloadTimer = setTimeout(() => {
        window.location.reload();
      }, 2500);
      
      return () => clearTimeout(reloadTimer);
    }
  }, [searchParams]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const result = await getUserAlerts();

      if (result.success && result.alerts) {
        setAlerts(result.alerts);
      } else {
        toast.error(result.error || "Failed to load alerts");
        setAlerts([]);
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
      toast.error("Failed to load alerts");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
    toast.success("Alerts refreshed");
  };

  useEffect(() => {
    loadAlerts();
    loadSubscriptionPlan();
  }, []);

  const loadSubscriptionPlan = async () => {
    try {
      setPlanLoading(true);
      const result = await getCurrentUserSubscriptionPlan();
      if (result.success && result.plan) {
        setPlan(result.plan);
        const limits = await getSubscriptionLimits(result.plan);
        setAlertLimit(limits.maxAlerts);
      } else {
        setPlan("free");
        const limits = await getSubscriptionLimits("free");
        setAlertLimit(limits.maxAlerts);
      }
    } catch (error) {
      setPlan("free");
      const limits = await getSubscriptionLimits("free");
      setAlertLimit(limits.maxAlerts);
    } finally {
      setPlanLoading(false);
    }
  };

  const handleAlertCreated = () => {
    setCreateDialogOpen(false);
    loadAlerts();
    // Refresh subscription plan in case limits changed
    loadSubscriptionPlan();
  };

  const handleAlertUpdated = () => {
    loadAlerts();
  };

  const activeAlertsCount = alerts.filter((alert) => alert.isActive).length;
  const triggeredAlertsCount = alerts.filter((alert) => alert.triggeredAt).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">Price Alerts</h1>
            {planLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <SubscriptionBadge />
            )}
          </div>
          <p className="text-gray-400">
            Get notified when stocks hit your target prices
          </p>
          {!planLoading && isFree && alertLimit !== null && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
              <Sparkles className="h-4 w-4" />
              <span>
                Using {activeAlertsCount}/{alertLimit} alerts
              </span>
              {activeAlertsCount >= alertLimit && (
                <span className="text-yellow-500 font-medium">
                  • Limit reached
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {!planLoading && isFree && (
            <Button
              variant="outline"
              onClick={() => setUpgradeDialogOpen(true)}
              className="flex items-center gap-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade
            </Button>
          )}
          {!planLoading && (isPro || isEnterprise || (isFree && activeAlertsCount < (alertLimit || 0))) && (
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-gray-900 font-medium"
              disabled={isFree && activeAlertsCount >= (alertLimit || 0)}
            >
              <Plus className="h-4 w-4" />
              Create Alert
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Alerts
              </CardTitle>
              <Bell className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{alerts.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {activeAlertsCount} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Active Alerts
              </CardTitle>
              <Bell className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {activeAlertsCount}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {alerts.length - activeAlertsCount} inactive
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Triggered
              </CardTitle>
              <BellOff className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                {triggeredAlertsCount}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Alerts that fired
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-8">
          <AlertsList alerts={alerts} onAlertUpdated={handleAlertUpdated} />
        </div>
      )}
      <CreateAlertDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onAlertCreated={handleAlertCreated}
      />

      {upgradeDialogOpen && (
        <UpgradeDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          reason={
            isFree && activeAlertsCount >= (alertLimit || 0)
              ? `You've reached the limit of ${alertLimit} alerts for your free plan. Upgrade to Pro for unlimited alerts.`
              : undefined
          }
        />
      )}
    </div>
  );
}

