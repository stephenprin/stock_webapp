"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePriceAlert, type PriceAlertPlain } from "@/lib/actions/alerts.actions";
import { getStockQuote } from "@/lib/actions/finnhub.actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditAlertDialogProps {
  alert: PriceAlertPlain;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAlertUpdated?: () => void;
}

interface FormData {
  alertName: string;
  threshold: number;
}

export default function EditAlertDialog({
  alert,
  open,
  onOpenChange,
  onAlertUpdated,
}: EditAlertDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      alertName: alert.alertName,
      threshold: alert.threshold,
    },
  });

  const threshold = watch("threshold");
  const alertType = alert.alertType;

  // Fetch current price when dialog opens
  useEffect(() => {
    if (open && alert.symbol) {
      setFetchingPrice(true);
      getStockQuote(alert.symbol)
        .then((quote) => {
          if (quote) {
            setCurrentPrice(quote.currentPrice);
          }
        })
        .catch((error) => {
          console.error("Error fetching price:", error);
        })
        .finally(() => {
          setFetchingPrice(false);
        });
    }
  }, [open, alert.symbol]);

  useEffect(() => {
    if (open) {
      reset({
        alertName: alert.alertName,
        threshold: alert.threshold,
      });
      setCurrentPrice(alert.currentPrice || null);
    }
  }, [open, alert, reset]);

  const onSubmit = async (data: FormData) => {
    if (data.threshold <= 0) {
      toast.error("Threshold must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const result = await updatePriceAlert(alert._id, {
        alertName: data.alertName.trim() || alert.alertName,
        threshold: Number(data.threshold),
      });

      if (result.success) {
        toast.success("Alert updated successfully");
        onAlertUpdated?.();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to update alert");
      }
    } catch (error) {
      console.error("Error updating alert:", error);
      toast.error("Failed to update alert");
    } finally {
      setLoading(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Edit Price Alert
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Update your alert settings for {alert.symbol} ({alert.company}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Symbol and Company (Read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Symbol</Label>
              <Input
                value={alert.symbol}
                disabled
                className="bg-gray-800 border-gray-600 text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Company</Label>
              <Input
                value={alert.company}
                disabled
                className="bg-gray-800 border-gray-600 text-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">Alert Type</Label>
            <Input
              value={alertType === "upper" ? "Upper" : "Lower"}
              disabled
              className="bg-gray-800 border-gray-600 text-gray-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alertName" className="text-sm font-medium text-gray-300">
              Alert Name *
            </Label>
            <Input
              id="alertName"
              placeholder="e.g., AAPL Breakout Alert"
              {...register("alertName", {
                required: "Alert name is required",
              })}
              className="w-full h-12 bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {errors.alertName && (
              <p className="text-sm text-red-400">{errors.alertName.message}</p>
            )}
          </div>

          {currentPrice && (
            <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Current Price</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(currentPrice)}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="threshold" className="text-sm font-medium text-gray-300">
              Price Threshold ($) *
            </Label>
            <Input
              id="threshold"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter target price"
              {...register("threshold", {
                required: "Threshold is required",
                min: {
                  value: 0.01,
                  message: "Threshold must be greater than 0",
                },
                valueAsNumber: true,
              })}
              className="w-full h-12 bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {errors.threshold && (
              <p className="text-sm text-red-400">{errors.threshold.message}</p>
            )}
            {currentPrice && threshold > 0 && (
              <p className="text-xs text-gray-500">
                {alertType === "upper" ? (
                  threshold > currentPrice ? (
                    <span className="text-green-400">
                      Alert will trigger when price reaches {formatCurrency(threshold)} (
                      {(((threshold - currentPrice) / currentPrice) * 100).toFixed(1)}%
                      above current)
                    </span>
                  ) : (
                    <span className="text-yellow-400">
                      Warning: Threshold ({formatCurrency(threshold)}) is below current
                      price. Alert will trigger immediately.
                    </span>
                  )
                ) : (
                  threshold < currentPrice ? (
                    <span className="text-green-400">
                      Alert will trigger when price drops to {formatCurrency(threshold)} (
                      {(((currentPrice - threshold) / currentPrice) * 100).toFixed(1)}%
                      below current)
                    </span>
                  ) : (
                    <span className="text-yellow-400">
                      Warning: Threshold ({formatCurrency(threshold)}) is above current
                      price. Alert will trigger immediately.
                    </span>
                  )
                )}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-gray-900 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Alert"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

