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
import { useSubscription } from "@/lib/hooks/useSubscription";
import { getSubscriptionLimits } from "@/lib/utils/subscription";

export default function AlertsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [alerts, setAlerts] = useState<PriceAlertPlain[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const { plan, isFree, isPro, isEnterprise } = useSubscription();
  const [alertLimit, setAlertLimit] = useState<number | null>(null);

  useEffect(() => {
    const upgraded = searchParams.get("upgraded");
    if (upgraded === "true") {
      toast.success("Upgrade successful! Your subscription is now active.", {
        duration: 5000,
      });
      router.replace("/alerts");

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [searchParams, router]);

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
  }, []);

  useEffect(() => {
    const fetchLimit = async () => {
      const limits = await getSubscriptionLimits(plan);
      setAlertLimit(limits.maxAlerts);
    };
    if (plan) {
      fetchLimit();
    }
  }, [plan]);

  const handleAlertCreated = () => {
    setCreateDialogOpen(false);
    loadAlerts();
  };

  const handleAlertUpdated = () => {
    loadAlerts();
  };

  const activeAlertsCount = alerts.filter((alert) => alert.isActive).length;
  const triggeredAlertsCount = alerts.filter((alert) => alert.triggeredAt).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">Price Alerts</h1>
            <SubscriptionBadge />
          </div>
          <p className="text-gray-400">
            Get notified when stocks hit your target prices
          </p>
          {isFree && alertLimit !== null && (
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
          {isFree && (
            <Button
              variant="outline"
              onClick={() => setUpgradeDialogOpen(true)}
              className="flex items-center gap-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade
            </Button>
          )}
          {(isPro || isEnterprise || (isFree && activeAlertsCount < (alertLimit || 0))) && (
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

      <div className="mb-8">
        <AlertsList alerts={alerts} onAlertUpdated={handleAlertUpdated} />
      </div>
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

