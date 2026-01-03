"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PortfolioHolding } from "@/database/models/portfolio-holding.model";
import { updatePosition } from "@/lib/actions/portfolio.actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditPositionDialogProps {
  holding: PortfolioHolding;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPositionUpdated: () => void;
}

interface FormData {
  quantity: number;
  averageCost: number;
  notes: string;
}

export default function EditPositionDialog({
  holding,
  open,
  onOpenChange,
  onPositionUpdated,
}: EditPositionDialogProps) {
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      quantity: holding.quantity,
      averageCost: holding.averageCost,
      notes: holding.notes || "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        quantity: holding.quantity,
        averageCost: holding.averageCost,
        notes: holding.notes || "",
      });
    }
  }, [open, holding, reset]);

  const onSubmit = async (data: FormData) => {
    if (data.quantity <= 0 || data.averageCost <= 0) {
      toast.error("Quantity and average cost must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const result = await updatePosition({
        holdingId: holding._id.toString(),
        quantity: data.quantity,
        averageCost: data.averageCost,
        notes: data.notes || "",
      });

      if (result.success) {
        toast.success(result.message || "Position updated successfully");
        onPositionUpdated();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to update position");
      }
    } catch (error) {
      toast.error("Failed to update position");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-white">
            Edit Position - {holding.symbol}
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-1">
            Update quantity, average cost, or notes for this position
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-gray-300 text-sm font-medium">
              Quantity *
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              {...register("quantity", {
                required: "Quantity is required",
                min: { value: 0.01, message: "Must be greater than 0" },
                valueAsNumber: true,
              })}
              className="bg-gray-700 border-gray-600 text-white h-10"
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="averageCost" className="text-gray-300 text-sm font-medium">
              Average Cost per Share *
            </Label>
            <Input
              id="averageCost"
              type="number"
              step="0.01"
              {...register("averageCost", {
                required: "Average cost is required",
                min: { value: 0.01, message: "Must be greater than 0" },
                valueAsNumber: true,
              })}
              className="bg-gray-700 border-gray-600 text-white h-10"
            />
            {errors.averageCost && (
              <p className="text-red-500 text-sm mt-1">
                {errors.averageCost.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-300 text-sm font-medium">
              Notes
            </Label>
            <Input
              id="notes"
              {...register("notes")}
              className="bg-gray-700 border-gray-600 text-white h-10"
              placeholder="Add any notes..."
            />
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
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Position"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

