"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Trash2,
  Edit,
  Power,
  PowerOff,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  deletePriceAlert,
  toggleAlertStatus,
  type PriceAlertPlain,
} from "@/lib/actions/alerts.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import EditAlertDialog from "./EditAlertDialog";

interface AlertsListProps {
  alerts: PriceAlertPlain[];
  onAlertUpdated?: () => void;
}

export default function AlertsList({
  alerts,
  onAlertUpdated,
}: AlertsListProps) {
  const [editingAlert, setEditingAlert] = useState<PriceAlertPlain | null>(null);
  const [togglingAlertId, setTogglingAlertId] = useState<string | null>(null);
  const [deletingAlertId, setDeletingAlertId] = useState<string | null>(null);
  const router = useRouter();

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

  if (alerts.length === 0) {
    return (
      <div className="rounded-md border border-gray-700 p-12 text-center">
        <p className="text-gray-400 text-lg mb-2">No alerts yet</p>
        <p className="text-gray-500 text-sm">
          Create your first price alert to get notified when stocks hit your target prices.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700 hover:bg-gray-800/50">
              <TableHead className="text-gray-400 font-medium">Status</TableHead>
              <TableHead className="text-gray-400 font-medium">Symbol</TableHead>
              <TableHead className="text-gray-400 font-medium">Company</TableHead>
              <TableHead className="text-gray-400 font-medium">Alert Name</TableHead>
              <TableHead className="text-gray-400 font-medium">Type</TableHead>
              <TableHead className="text-gray-400 font-medium text-right">
                Threshold
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-right">
                Current Price
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-right">
                Difference
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-center">
                Triggered
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-center w-[50px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.map((alert) => {
              const isActive = alert.isActive;
              const isTriggered = !!alert.triggeredAt;
              const priceDiff = getPriceDifference(alert.currentPrice, alert.threshold);
              const isUpper = alert.alertType === "upper";
              const isNearThreshold =
                priceDiff &&
                ((isUpper && priceDiff.percent >= -5 && priceDiff.percent <= 5) ||
                  (!isUpper && priceDiff.percent >= -5 && priceDiff.percent <= 5));

              return (
                <TableRow
                  key={alert._id}
                  className="border-gray-700 hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => router.push(`/search?symbol=${alert.symbol}`)}
                >
                  <TableCell>
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className={
                        isActive
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-gray-700 text-gray-400 border-gray-600"
                      }
                    >
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-white">
                    {alert.symbol}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {alert.company}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {alert.alertName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {isUpper ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-400" />
                          <span className="text-green-400">Upper</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-400" />
                          <span className="text-red-400">Lower</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-white font-medium">
                    {formatCurrency(alert.threshold)}
                  </TableCell>
                  <TableCell className="text-right text-white font-medium">
                    {alert.currentPrice
                      ? formatCurrency(alert.currentPrice)
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    {priceDiff ? (
                      <div
                        className={`font-medium ${
                          isUpper
                            ? priceDiff.diff >= 0
                              ? "text-green-400"
                              : "text-gray-400"
                            : priceDiff.diff <= 0
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        {priceDiff.diff >= 0 ? "+" : ""}
                        {formatCurrency(priceDiff.diff)} (
                        {priceDiff.percent >= 0 ? "+" : ""}
                        {priceDiff.percent.toFixed(1)}%)
                      </div>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {isTriggered ? (
                      <div className="flex items-center justify-center gap-1 text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs">
                          {formatDate(alert.triggeredAt)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">Not triggered</span>
                    )}
                  </TableCell>
                  <TableCell
                    className="text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-700"
                          disabled={
                            togglingAlertId === alert._id ||
                            deletingAlertId === alert._id
                          }
                        >
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-gray-800 border-gray-700"
                      >
                        <DropdownMenuItem
                          className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                          onClick={() => setEditingAlert(alert)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Alert
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleToggleStatus(alert._id)}
                          disabled={togglingAlertId === alert._id}
                        >
                          {isActive ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem
                          className="text-red-400 hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleDelete(alert._id, alert.symbol)}
                          disabled={deletingAlertId === alert._id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
    </>
  );
}

