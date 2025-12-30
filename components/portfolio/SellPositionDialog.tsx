"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PortfolioHolding } from "@/database/models/portfolio-holding.model";
import { sellPosition } from "@/lib/actions/portfolio.actions";
import { getStockQuote } from "@/lib/actions/finnhub.actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SellPositionDialogProps {
  holding: PortfolioHolding;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPositionUpdated: () => void;
}

interface FormData {
  quantity: number;
  price: number;
  fees: number;
  date: string;
  notes: string;
}

export default function SellPositionDialog({
  holding,
  open,
  onOpenChange,
  onPositionUpdated,
}: SellPositionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      quantity: 0,
      price: holding.currentPrice || holding.averageCost,
      fees: 0,
      date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        quantity: 0,
        price: holding.currentPrice || holding.averageCost,
        fees: 0,
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
  }, [open, holding, reset]);

  const handleFetchPrice = async () => {
    setFetchingPrice(true);
    try {
      const quote = await getStockQuote(holding.symbol);
      if (quote) {
        setValue("price", quote.currentPrice);
        toast.success(`Current price: $${quote.currentPrice.toFixed(2)}`);
      } else {
        toast.error("Could not fetch price for this symbol");
      }
    } catch (error) {
      console.error("Error fetching price:", error);
      toast.error("Failed to fetch price");
    } finally {
      setFetchingPrice(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (data.quantity <= 0 || data.price <= 0) {
      toast.error("Quantity and price must be greater than 0");
      return;
    }

    if (data.quantity > holding.quantity) {
      toast.error(`You only have ${holding.quantity} shares`);
      return;
    }

    setLoading(true);
    try {
      const result = await sellPosition({
        symbol: holding.symbol,
        quantity: data.quantity,
        price: data.price,
        fees: data.fees || 0,
        date: data.date ? new Date(data.date) : new Date(),
        notes: data.notes,
      });

      if (result.success) {
        toast.success(result.message || "Shares sold successfully");
        onPositionUpdated();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to sell shares");
      }
    } catch (error) {
      console.error("Error selling position:", error);
      toast.error("Failed to sell shares");
    } finally {
      setLoading(false);
    }
  };

  const maxQuantity = holding.quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-white">
            Sell Shares - {holding.symbol}
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-1">
            You have {maxQuantity.toLocaleString()} shares available to sell
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-gray-300 text-sm font-medium">
              Quantity to Sell * (Max: {maxQuantity.toLocaleString()})
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              max={maxQuantity}
              {...register("quantity", {
                required: "Quantity is required",
                min: { value: 0.01, message: "Must be greater than 0" },
                max: {
                  value: maxQuantity,
                  message: `Cannot exceed ${maxQuantity.toLocaleString()} shares`,
                },
                valueAsNumber: true,
              })}
              className="bg-gray-700 border-gray-600 text-white h-10"
              placeholder="0"
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-gray-300 text-sm font-medium flex items-center justify-between">
              <span>Price per Share *</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleFetchPrice}
                disabled={fetchingPrice}
                className="h-6 px-2 text-xs text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10"
              >
                {fetchingPrice ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Fetch"
                )}
              </Button>
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register("price", {
                required: "Price is required",
                min: { value: 0.01, message: "Must be greater than 0" },
                valueAsNumber: true,
              })}
              className="bg-gray-700 border-gray-600 text-white h-10"
              placeholder="0.00"
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">
                {errors.price.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fees" className="text-gray-300 text-sm font-medium">
              Fees/Commission
            </Label>
            <Input
              id="fees"
              type="number"
              step="0.01"
              {...register("fees", { valueAsNumber: true })}
              className="bg-gray-700 border-gray-600 text-white h-10"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-gray-300 text-sm font-medium">
              Sale Date
            </Label>
            <Input
              id="date"
              type="date"
              {...register("date", { required: "Date is required" })}
              className="bg-gray-700 border-gray-600 text-white h-10"
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-300 text-sm font-medium">
              Notes (Optional)
            </Label>
            <Input
              id="notes"
              {...register("notes")}
              className="bg-gray-700 border-gray-600 text-white h-10"
              placeholder="Add any notes..."
            />
          </div>

          <div className="bg-gray-700/50 p-4 rounded-md">
            <p className="text-sm text-gray-400">
              Average Cost: ${holding.averageCost.toFixed(2)} per share
            </p>
            {watch("quantity") > 0 && watch("price") > 0 && (
              <p className="text-sm text-gray-300 mt-2">
                Estimated Proceeds: $
                {(
                  watch("quantity") * watch("price") -
                  (watch("fees") || 0)
                ).toFixed(2)}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Selling...
                </>
              ) : (
                "Sell Shares"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

