"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Star, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import UpgradeDialog from "@/components/billing/UpgradeDialog";
import { cn } from "@/lib/utils/utils";

export default function WatchlistButton({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(isInWatchlist);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  // Sync internal state with prop changes
  useEffect(() => {
    setCurrentStatus(isInWatchlist);
  }, [isInWatchlist]);

  const handleToggle = async () => {
    if (loading) return;

    setLoading(true);
    try {
      if (currentStatus) {
        // Remove from watchlist
        const result = await removeFromWatchlist(symbol);
        if (result.success) {
          setCurrentStatus(false);
          toast.success(result.message || `${symbol} removed from watchlist`);
          onWatchlistChange?.(symbol, false);
        } else {
          toast.error(result.error || "Failed to remove from watchlist");
        }
      } else {
        // Add to watchlist
        const result = await addToWatchlist(symbol, company);
        if (result.success) {
          setCurrentStatus(true);
          toast.success(result.message || `${symbol} added to watchlist`);
          onWatchlistChange?.(symbol, true);
        } else {
          if (result.upgradeRequired) {
            setUpgradeDialogOpen(true);
          } else {
            toast.error(result.error || "Failed to add to watchlist");
          }
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (type === "icon") {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          disabled={loading}
          className={cn(
            "watchlist-icon-btn",
            currentStatus && "watchlist-icon-added"
          )}
          aria-label={currentStatus ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        >
          {loading ? (
            <Loader2 className="star-icon animate-spin" />
          ) : showTrashIcon && currentStatus ? (
            <Trash2 className="trash-icon" />
          ) : (
            <Star className={cn("star-icon", currentStatus && "text-yellow-500 fill-yellow-500")} />
          )}
        </Button>
        <UpgradeDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleToggle}
        disabled={loading}
        className={cn(
          "watchlist-btn text-sm sm:text-base",
          currentStatus && showTrashIcon && "watchlist-remove"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span className="hidden sm:inline">{currentStatus ? "Removing..." : "Adding..."}</span>
            <span className="sm:hidden">{currentStatus ? "Removing" : "Adding"}</span>
          </>
        ) : currentStatus ? (
          <>
            {showTrashIcon ? (
              <Trash2 className="h-4 w-4 shrink-0" />
            ) : (
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-100 shrink-0" />
            )}
            <span className="hidden sm:inline">Remove from Watchlist</span>
            <span className="sm:hidden">Remove</span>
          </>
        ) : (
          <>
            <Star className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Add to Watchlist</span>
            <span className="sm:hidden">Watchlist</span>
          </>
        )}
      </Button>
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
      />
    </>
  );
}

