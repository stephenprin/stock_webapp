"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { addPosition, searchStocksAction } from "@/lib/actions/portfolio.actions";
import { getStockQuote } from "@/lib/actions/finnhub.actions";
import { toast } from "sonner";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { useDebounce } from "@/lib/utils/debounce";
import { cn } from "@/lib/utils/utils";
import UpgradeDialog from "@/components/billing/UpgradeDialog";

interface AddPositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPositionAdded: () => void;
  defaultSymbol?: string;
  defaultCompanyName?: string;
}

interface FormData {
  symbol: string;
  companyName: string;
  quantity: number;
  price: number;
  fees: number;
  exchange: string;
  notes: string;
  date: string;
}

export default function AddPositionDialog({
  open,
  onOpenChange,
  onPositionAdded,
  defaultSymbol = "",
  defaultCompanyName = "",
}: AddPositionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<StockWithWatchlistStatus[]>([]);
  const [searchingStocks, setSearchingStocks] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string>();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      symbol: defaultSymbol,
      companyName: defaultCompanyName,
      quantity: 0,
      price: 0,
      fees: 0,
      exchange: "",
      notes: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const symbol = watch("symbol");
  const companyName = watch("companyName");

  // Search for stock suggestions as user types
  const performStockSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 1) {
        setSuggestions([]);
        setSuggestionsOpen(false);
        return;
      }

      setSearchingStocks(true);
      try {
        const result = await searchStocksAction(query.trim());
        if (result.success && result.stocks) {
          setSuggestions(result.stocks.slice(0, 8)); // Limit to 8 suggestions
          setSuggestionsOpen(result.stocks.length > 0);
        } else {
          setSuggestions([]);
          setSuggestionsOpen(false);
        }
      } catch (error) {
        setSuggestions([]);
        setSuggestionsOpen(false);
      } finally {
        setSearchingStocks(false);
      }
    },
    []
  );

  const debouncedStockSearch = useDebounce(performStockSearch, 300, [performStockSearch]);

  // Trigger search when symbol changes
  useEffect(() => {
    if (symbol && symbol.length >= 1) {
      debouncedStockSearch(symbol);
    } else {
      setSuggestions([]);
      setSuggestionsOpen(false);
    }
  }, [symbol, debouncedStockSearch]);

  // Auto-fetch current price when symbol changes (only if it looks like a valid symbol)
  useEffect(() => {
    if (symbol && symbol.length >= 1 && symbol.length <= 5 && /^[A-Z0-9.]+$/.test(symbol.toUpperCase())) {
      const timeoutId = setTimeout(async () => {
        setFetchingPrice(true);
        try {
          const quote = await getStockQuote(symbol);
          if (quote) {
            setValue("price", quote.currentPrice);
          }
        } catch (error) {
        } finally {
          setFetchingPrice(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [symbol, setValue]);

  useEffect(() => {
    if (open) {
      reset({
        symbol: defaultSymbol,
        companyName: defaultCompanyName,
        quantity: 0,
        price: 0,
        fees: 0,
        exchange: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
      });
      
      if (defaultSymbol) {
        getStockQuote(defaultSymbol).then((quote) => {
          if (quote) {
            setValue("price", quote.currentPrice);
          }
        });
      }
    }
  }, [open, defaultSymbol, defaultCompanyName, reset, setValue]);

  const onSubmit = async (data: FormData) => {
    if (data.quantity <= 0 || data.price <= 0) {
      toast.error("Quantity and price must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const result = await addPosition({
        symbol: data.symbol.toUpperCase(),
        companyName: data.companyName || data.symbol.toUpperCase(),
        quantity: data.quantity,
        price: data.price,
        fees: data.fees || 0,
        exchange: data.exchange,
        notes: data.notes,
        date: data.date ? new Date(data.date) : new Date(),
      });

      if (result.success) {
        toast.success(result.message || "Position added successfully");
        onPositionAdded();
        onOpenChange(false);
      } else {
        if (result.error && result.error.includes("Upgrade to Pro")) {
          setUpgradeReason(result.error);
          setUpgradeDialogOpen(true);
        } else {
          toast.error(result.error || "Failed to add position");
        }
      }
    } catch (error) {
      toast.error("Failed to add position");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPrice = async () => {
    if (!symbol) {
      toast.error("Please enter a symbol first");
      return;
    }

    setFetchingPrice(true);
    try {
      const quote = await getStockQuote(symbol);
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

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-white">Add Position</DialogTitle>
          <DialogDescription className="text-gray-400 mt-1">
            Add a new stock position to your portfolio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="symbol" className="text-gray-300 text-sm font-medium">
              Symbol *
            </Label>
            <Popover open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Input
                    id="symbol"
                    {...register("symbol", { required: "Symbol is required" })}
                    className="bg-gray-700 border-gray-600 text-white h-10 pr-10"
                    placeholder="AAPL"
                    autoFocus
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setValue("symbol", value, { shouldValidate: true });
                      if (value.trim()) {
                        setSuggestionsOpen(true);
                      } else {
                        setSuggestionsOpen(false);
                      }
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0 && symbol) {
                        setSuggestionsOpen(true);
                      }
                    }}
                    onBlur={() => {
                      // Close suggestions after a short delay to allow clicking on items
                      setTimeout(() => setSuggestionsOpen(false), 200);
                    }}
                  />
                  {searchingStocks && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                  {!searchingStocks && symbol && (
                    <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[var(--radix-popover-trigger-width)] p-0 bg-gray-800 border-gray-600" 
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <Command className="bg-gray-800 border-gray-600">
                  <CommandList className="max-h-60">
                    <CommandEmpty>
                      {searchingStocks ? "Searching..." : "No stocks found"}
                    </CommandEmpty>
                    <CommandGroup>
                      {suggestions.map((stock) => (
                        <CommandItem
                          key={stock.symbol}
                          value={`${stock.symbol} ${stock.name}`}
                          onSelect={() => {
                            setValue("symbol", stock.symbol, { shouldValidate: true });
                            setValue("companyName", stock.name);
                            if (stock.exchange) {
                              setValue("exchange", stock.exchange);
                            }
                            setSuggestionsOpen(false);
                            // Auto-fetch price for selected stock
                            getStockQuote(stock.symbol).then((quote) => {
                              if (quote) {
                                setValue("price", quote.currentPrice);
                              }
                            });
                          }}
                          className="text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              symbol === stock.symbol ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold">{stock.symbol}</span>
                            <span className="text-xs text-gray-400">{stock.name}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.symbol && (
              <p className="text-red-500 text-sm mt-1">{errors.symbol.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-gray-300 text-sm font-medium">
              Company Name
            </Label>
            <Input
              id="companyName"
              {...register("companyName")}
              className="bg-gray-700 border-gray-600 text-white h-10"
              placeholder="Apple Inc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                placeholder="10"
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
                  disabled={fetchingPrice || !symbol}
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
                placeholder="150.00"
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.price.message}
                </p>
              )}
            </div>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exchange" className="text-gray-300 text-sm font-medium">
                Exchange
              </Label>
              <Input
                id="exchange"
                {...register("exchange")}
                className="bg-gray-700 border-gray-600 text-white h-10"
                placeholder="NASDAQ"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-gray-300 text-sm font-medium">
                Purchase Date
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
                  Adding...
                </>
              ) : (
                "Add Position"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    <UpgradeDialog
      open={upgradeDialogOpen}
      onOpenChange={setUpgradeDialogOpen}
      targetPlan="pro"
      reason={upgradeReason}
    />
  </>
  );
}

