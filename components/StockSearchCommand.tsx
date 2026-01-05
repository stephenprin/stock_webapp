"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { searchStocksAction, addStockToPortfolio } from "@/lib/actions/portfolio.actions";
import { addToWatchlist } from "@/lib/actions/watchlist.actions";
import { toast } from "sonner";
import { Loader2, Plus, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/lib/utils/debounce";
import UpgradeDialog from "@/components/billing/UpgradeDialog";

interface StockSearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "portfolio" | "watchlist";
  onWatchlistAdded?: () => void;
}

export default function StockSearchCommand({
  open,
  onOpenChange,
  mode = "portfolio",
  onWatchlistAdded,
}: StockSearchCommandProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>([]);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  // Search function
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setLoading(true);
        try {
          const result = await searchStocksAction();
          if (result.success) {
            setStocks(result.stocks);
          } else {
            toast.error(result.error || "Failed to search stocks");
            setStocks([]);
          }
        } catch (error) {
          console.error("Search error:", error);
          toast.error("Failed to search stocks");
          setStocks([]);
        } finally {
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const result = await searchStocksAction(query);
        if (result.success) {
          setStocks(result.stocks);
        } else {
          toast.error(result.error || "Failed to search stocks");
          setStocks([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        toast.error("Failed to search stocks");
        setStocks([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const debouncedSearch = useDebounce(performSearch, 300, [performSearch]);

  // Trigger debounced search when searchTerm changes
  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    if (open) {
      setSearchTerm("");
      performSearch("");
    }
  }, [open, performSearch]);

  const handleAddToPortfolio = async (
    e: React.MouseEvent,
    symbol: string,
    name: string
  ) => {
    e.stopPropagation(); 

    const result = await addStockToPortfolio(symbol, name);

    if (result.success) {
      if (result.requiresDetails) {
        toast.success(result.message || `${symbol} ready to add. Go to Portfolio to enter details.`, {
          action: {
            label: "Go to Portfolio",
            onClick: () => router.push("/portfolio"),
          },
        });
      } else {
        toast.success(`${symbol} added to portfolio`);
      }
    } else {
      toast.error(result.error || "Failed to add stock to portfolio");
    }
  };

  const handleAddToWatchlist = async (
    e: React.MouseEvent,
    symbol: string,
    name: string
  ) => {
    e.stopPropagation();

    const result = await addToWatchlist(symbol, name);

    if (result.success) {
      toast.success(result.message || `${symbol} added to watchlist`);
      onWatchlistAdded?.();
      // Keep dialog open so user can add more stocks
      // Only close if user explicitly closes it
    } else {
      if (result.upgradeRequired) {
        setUpgradeDialogOpen(true);
      } else {
        toast.error(result.error || "Failed to add to watchlist");
      }
    }
  };

  const handleSelectStock = (symbol: string) => {
    onOpenChange(false);
    router.push(`/search?symbol=${symbol}`);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Stocks"
      description={mode === "watchlist" ? "Search for stocks to add to your watchlist" : "Search for stocks to add to your portfolio"}
    >
      <CommandInput
        placeholder="Search stocks by symbol or name..."
        value={searchTerm}
        onValueChange={setSearchTerm}
      />
      <CommandList>
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {!loading && stocks.length === 0 && (
          <CommandEmpty>
            {searchTerm
              ? "No stocks found. Try a different search term."
              : "Start typing to search for stocks..."}
          </CommandEmpty>
        )}

        {!loading && stocks.length > 0 && (
          <CommandGroup heading={searchTerm ? "Search Results" : "Popular Stocks"}>
            {stocks.map((stock) => (
              <CommandItem
                key={stock.symbol}
                value={`${stock.symbol} ${stock.name}`}
                onSelect={() => handleSelectStock(stock.symbol)}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold text-sm truncate">
                      {stock.symbol}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {stock.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {stock.exchange}
                    </span>
                    <button
                      onClick={(e) => mode === "watchlist" 
                        ? handleAddToWatchlist(e, stock.symbol, stock.name)
                        : handleAddToPortfolio(e, stock.symbol, stock.name)
                      }
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs transition-colors"
                      aria-label={`Add ${stock.symbol} to ${mode === "watchlist" ? "watchlist" : "portfolio"}`}
                    >
                      <Plus className="h-3 w-3" />
                      <span className="hidden sm:inline">Add</span>
                    </button>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>

      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        targetPlan="pro"
      />
    </CommandDialog>
  );
}

