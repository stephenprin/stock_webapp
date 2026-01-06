"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingUp, TrendingDown, Power, PowerOff, Edit, Trash2, Plus, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  deletePriceAlert,
  toggleAlertStatus,
  type PriceAlertPlain,
} from "@/lib/actions/alerts.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/utils";
import EditAlertDialog from "@/components/alerts/EditAlertDialog";
import CreateAlertDialog from "@/components/alerts/CreateAlertDialog";

interface WatchlistAlertsProps {
  alerts?: PriceAlertPlain[];
  watchlistSymbols: string[];
  onAlertUpdated?: () => void;
}

export default function WatchlistAlerts({
  alerts = [],
  watchlistSymbols,
  onAlertUpdated,
}: WatchlistAlertsProps) {
  const [editingAlert, setEditingAlert] = useState<PriceAlertPlain | null>(null);
  const [createAlertDialogOpen, setCreateAlertDialogOpen] = useState(false);
  const [togglingAlertId, setTogglingAlertId] = useState<string | null>(null);
  const [deletingAlertId, setDeletingAlertId] = useState<string | null>(null);
  const router = useRouter();

  // Filter alerts to only show those for watchlist stocks
  const watchlistAlerts = useMemo(() => {
    if (!alerts || watchlistSymbols.length === 0) return [];
    const symbolSet = new Set(watchlistSymbols.map(s => s.toUpperCase()));
    return alerts.filter(alert => symbolSet.has(alert.symbol.toUpperCase()));
  }, [alerts, watchlistSymbols]);

  const handleDelete = async (alertId: string, symbol: string) => {
    if (!confirm(`Are you sure you want to delete the alert for ${symbol}?`)) {
      return;
    }

    setDeletingAlertId(alertId);
    try {
      const result = await deletePriceAlert(alertId);

      if (result.success) {
        toast.success("Alert deleted successfully");
        onAlertUpdated?.();
      } else {
        toast.error(result.error || "Failed to delete alert");
      }
    } catch (error) {
      toast.error("Failed to delete alert");
    } finally {
      setDeletingAlertId(null);
    }
  };

  const handleToggleStatus = async (alertId: string) => {
    setTogglingAlertId(alertId);
    try {
      const result = await toggleAlertStatus(alertId);

      if (result.success && result.alert) {
        toast.success(
          result.alert.isActive
            ? "Alert activated"
            : "Alert deactivated"
        );
        onAlertUpdated?.();
      } else {
        toast.error(result.error || "Failed to toggle alert status");
      }
    } catch (error) {
      toast.error("Failed to toggle alert status");
    } finally {
      setTogglingAlertId(null);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const getPriceDifference = (currentPrice: number | undefined, threshold: number) => {
    if (!currentPrice) return null;
    const diff = currentPrice - threshold;
    const percent = (diff / threshold) * 100;
    return { diff, percent };
  };

  if (watchlistSymbols.length === 0) {
    return (
      <div className="alert-empty">
        <Bell className="h-8 w-8 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No stocks in your watchlist</p>
        <p className="text-gray-500 text-xs mt-1">Add stocks to see related alerts here</p>
      </div>
    );
  }

  if (watchlistAlerts.length === 0) {
    return (
      <>
        <div className="alert-empty">
          <Bell className="h-8 w-8 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-2">No alerts for your watchlist stocks</p>
          <p className="text-gray-500 text-xs mb-4">Create alerts to get notified about price movements</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateAlertDialogOpen(true)}
            className="bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>
        <CreateAlertDialog
          open={createAlertDialogOpen}
          onOpenChange={setCreateAlertDialogOpen}
          onAlertCreated={() => {
            setCreateAlertDialogOpen(false);
            onAlertUpdated?.();
          }}
        />
      </>
    );
  }

  return (
    <>
      <div className="alert-list">
        {watchlistAlerts.map((alert) => {
          const isActive = alert.isActive;
          const isTriggered = !!alert.triggeredAt;
          const priceDiff = getPriceDifference(alert.currentPrice, alert.threshold || 0);
          const isUpper = alert.alertType === "upper";

          return (
            <div
              key={alert._id}
              className="alert-item cursor-pointer"
              onClick={() => router.push(`/search?symbol=${alert.symbol}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="alert-name">{alert.alertName}</h3>
                  <div className="alert-details">
                    <span className="alert-company">
                      {alert.symbol} • {alert.company}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className={
                    isActive
                      ? "bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                      : "bg-gray-700 text-gray-400 border-gray-600 text-xs"
                  }
                >
                  {isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isUpper ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                  <span className="text-sm text-gray-400">
                    {isUpper ? "Above" : "Below"} {alert.threshold ? formatCurrency(alert.threshold) : "N/A"}
                  </span>
                </div>
                {alert.currentPrice && (
                  <span className="alert-price text-sm">
                    {formatCurrency(alert.currentPrice)}
                  </span>
                )}
              </div>

              {priceDiff && (
                <div className={`text-xs mb-2 ${isUpper ? priceDiff.diff >= 0 ? "text-green-400" : "text-gray-400" : priceDiff.diff <= 0 ? "text-red-400" : "text-gray-400"}`}>
                  {priceDiff.diff >= 0 ? "+" : ""}{formatCurrency(priceDiff.diff)} ({priceDiff.percent >= 0 ? "+" : ""}{priceDiff.percent.toFixed(1)}%)
                </div>
              )}

              {isTriggered && (
                <div className="flex items-center gap-1 text-green-400 text-xs mb-2">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Triggered {formatDate(alert.triggeredAt)}</span>
                </div>
              )}

              <div
                className="alert-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleStatus(alert._id)}
                  disabled={togglingAlertId === alert._id}
                  className="alert-update-btn h-7 px-2 text-xs"
                >
                  {isActive ? (
                    <>
                      <PowerOff className="h-3 w-3 mr-1" />
                      Off
                    </>
                  ) : (
                    <>
                      <Power className="h-3 w-3 mr-1" />
                      On
                    </>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-xs"
                      disabled={deletingAlertId === alert._id}
                    >
                      ...
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem
                      className="text-gray-300 hover:bg-gray-700 cursor-pointer text-xs"
                      onClick={() => setEditingAlert(alert)}
                    >
                      <Edit className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem
                      className="text-red-400 hover:bg-gray-700 cursor-pointer text-xs"
                      onClick={() => handleDelete(alert._id, alert.symbol)}
                      disabled={deletingAlertId === alert._id}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {editingAlert && (
        <EditAlertDialog
          alert={editingAlert}
          open={!!editingAlert}
          onOpenChange={(open) => !open && setEditingAlert(null)}
          onAlertUpdated={() => {
            setEditingAlert(null);
            onAlertUpdated?.();
          }}
        />
      )}

      <CreateAlertDialog
        open={createAlertDialogOpen}
        onOpenChange={setCreateAlertDialogOpen}
        onAlertCreated={() => {
          setCreateAlertDialogOpen(false);
          onAlertUpdated?.();
        }}
      />
    </>
  );
}

