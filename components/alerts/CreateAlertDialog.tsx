"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { createPriceAlert, CreatePriceAlertData } from "@/lib/actions/alerts.actions";
import { searchStocksAction } from "@/lib/actions/portfolio.actions";
import { getStockQuote } from "@/lib/actions/finnhub.actions";
import { toast } from "sonner";
import { Loader2, Check, ChevronsUpDown, Sparkles, Lock } from "lucide-react";
import { useDebounce } from "@/lib/utils/debounce";
import { cn } from "@/lib/utils/utils";
import { ALERT_TYPE_OPTIONS } from "@/lib/constants";
import UpgradeDialog from "@/components/billing/UpgradeDialog";
import SelectField from "@/components/forms/SelectField";
import { useSubscription } from "@/lib/hooks/useSubscription";
import type { AlertSubType, Condition, TechnicalIndicatorConfig } from "@/database/models/price-alert.model";

interface CreateAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAlertCreated: () => void;
  defaultSymbol?: string;
  defaultCompany?: string;
}

interface FormData {
  symbol: string;
  company: string;
  alertName: string;
  alertType: "upper" | "lower";
  alertSubType: AlertSubType;
  threshold?: number;
  percentageThreshold?: number;
  conditions?: Condition[];
  conditionLogic?: "AND" | "OR";
  technicalIndicator?: TechnicalIndicatorConfig;
}

export default function CreateAlertDialog({
  open,
  onOpenChange,
  onAlertCreated,
  defaultSymbol = "",
  defaultCompany = "",
}: CreateAlertDialogProps) {
  const { isPro, isEnterprise } = useSubscription();
  const hasAdvancedFeatures = isPro || isEnterprise;
  
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<StockWithWatchlistStatus[]>([]);
  const [searchingStocks, setSearchingStocks] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string>();
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      symbol: defaultSymbol,
      company: defaultCompany,
      alertName: "",
      alertType: "upper",
      alertSubType: "price",
      threshold: 0,
    },
  });

  const symbol = watch("symbol");
  const company = watch("company");
  const alertType = watch("alertType");
  const alertSubType = watch("alertSubType");
  const threshold = watch("threshold");
  const percentageThreshold = watch("percentageThreshold");

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
          setSuggestions(result.stocks.slice(0, 8));
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

  // Auto-fetch current price when symbol is selected
  useEffect(() => {
    if (symbol && symbol.length >= 1 && symbol.length <= 5 && /^[A-Z0-9.]+$/.test(symbol.toUpperCase())) {
      const timeoutId = setTimeout(async () => {
        setFetchingPrice(true);
        try {
          const quote = await getStockQuote(symbol);
          if (quote) {
            setCurrentPrice(quote.currentPrice);
            const currentSubType = watch("alertSubType") || "price";
            if (currentSubType === "price" && (!threshold || threshold === 0)) {
              const suggestedThreshold =
                alertType === "upper"
                  ? quote.currentPrice * 1.1
                  : quote.currentPrice * 0.9;
              setValue("threshold", Number(suggestedThreshold.toFixed(2)));
            }
          }
        } catch (error) {
          // Error fetching price - silently fail
        } finally {
          setFetchingPrice(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [symbol, setValue, alertType, alertSubType, threshold, watch]);

  useEffect(() => {
    if (open) {
      reset({
        symbol: defaultSymbol,
        company: defaultCompany,
        alertName: "",
        alertType: "upper",
        alertSubType: "price",
        threshold: 0,
      });
      setCurrentPrice(null);
      setShowAdvancedOptions(false);

      if (defaultSymbol) {
        getStockQuote(defaultSymbol).then((quote) => {
          if (quote) {
            setCurrentPrice(quote.currentPrice);
            setTimeout(() => {
              const currentSubType = watch("alertSubType") || "price";
              if (currentSubType === "price") {
                const suggestedThreshold = quote.currentPrice * 1.1;
                setValue("threshold", Number(suggestedThreshold.toFixed(2)));
              }
            }, 100);
          }
        });
      }
    }
  }, [open, defaultSymbol, defaultCompany, reset, setValue, watch]);

  const onSubmit = async (data: FormData) => {
    if (!data.symbol || !data.company) {
      toast.error("Please select a stock symbol and company");
      return;
    }

    if (data.alertSubType === "price" || data.alertSubType === "volume") {
      if (!data.threshold || data.threshold <= 0) {
        toast.error("Threshold must be greater than 0");
        return;
      }
    }

    if (data.alertSubType === "percentage") {
      if (data.percentageThreshold === undefined || data.percentageThreshold === null) {
        toast.error("Percentage threshold is required");
        return;
      }
    }

    setLoading(true);
    try {
      const alertData: CreatePriceAlertData = {
        symbol: data.symbol.toUpperCase().trim(),
        company: data.company.trim(),
        alertName: data.alertName.trim() || `${data.symbol} ${data.alertType} ${data.alertSubType} alert`,
        alertType: data.alertType,
        alertSubType: data.alertSubType,
        threshold: data.threshold ? Number(data.threshold) : undefined,
        percentageThreshold: data.percentageThreshold,
        conditions: data.conditions,
        conditionLogic: data.conditionLogic,
        technicalIndicator: data.technicalIndicator,
      };

      const result = await createPriceAlert(alertData);

      if (result.success) {
        toast.success("Price alert created successfully");
        onAlertCreated();
        onOpenChange(false);
      } else {
        if (result.upgradeRequired || result.error?.includes("limit") || result.error?.includes("Upgrade")) {
          setUpgradeReason(result.error || "You've reached your alert limit");
          setUpgradeDialogOpen(true);
        } else {
          toast.error(result.error || "Failed to create alert");
        }
      }
    } catch (error) {
      toast.error("Failed to create alert");
    } finally {
      setLoading(false);
    }
  };

  const handleStockSelect = (stock: StockWithWatchlistStatus) => {
    setValue("symbol", stock.symbol);
    setValue("company", stock.name || stock.symbol);
    setSuggestionsOpen(false);
    
    getStockQuote(stock.symbol).then((quote) => {
      if (quote) {
        setCurrentPrice(quote.currentPrice);
        const currentSubType = watch("alertSubType") || "price";
        if (currentSubType === "price") {
          const suggestedThreshold =
            watch("alertType") === "upper"
              ? quote.currentPrice * 1.1
              : quote.currentPrice * 0.9;
          setValue("threshold", Number(suggestedThreshold.toFixed(2)));
        }
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Create Price Alert</DialogTitle>
            <DialogDescription className="text-gray-400">
              Set up an alert to be notified when a stock price reaches your target threshold.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
            {/* Symbol Input with Autocomplete */}
            <div className="space-y-2">
              <Label htmlFor="symbol" className="text-sm font-medium text-gray-300">
                Stock Symbol *
              </Label>
              <Popover open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      id="symbol"
                      placeholder="Enter stock symbol (e.g., AAPL)"
                      {...register("symbol", {
                        required: "Stock symbol is required",
                        pattern: {
                          value: /^[A-Z0-9.]+$/i,
                          message: "Invalid stock symbol format",
                        },
                      })}
                      className="w-full h-12 bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={symbol}
                      onChange={(e) => {
                        setValue("symbol", e.target.value.toUpperCase());
                        if (e.target.value.length >= 1) {
                          setSuggestionsOpen(true);
                        }
                      }}
                    />
                    {fetchingPrice && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0 bg-gray-800 border-gray-600"
                  align="start"
                >
                  <Command className="bg-gray-800">
                    <CommandInput
                      placeholder="Search stocks..."
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    />
                    <CommandList>
                      <CommandEmpty className="text-gray-400 py-6 text-center text-sm">
                        {searchingStocks ? "Searching..." : "No stocks found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {suggestions.map((stock) => (
                          <CommandItem
                            key={`${stock.symbol}-${stock.exchange}`}
                            value={`${stock.symbol} ${stock.name}`}
                            onSelect={() => handleStockSelect(stock)}
                            className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700 cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                symbol === stock.symbol ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{stock.symbol}</span>
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
                <p className="text-sm text-red-400">{errors.symbol.message}</p>
              )}
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium text-gray-300">
                Company Name *
              </Label>
              <Input
                id="company"
                placeholder="Enter company name"
                {...register("company", {
                  required: "Company name is required",
                })}
                className="w-full h-12 bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {errors.company && (
                <p className="text-sm text-red-400">{errors.company.message}</p>
              )}
            </div>

            {/* Alert Name */}
            <div className="space-y-2">
              <Label htmlFor="alertName" className="text-sm font-medium text-gray-300">
                Alert Name (Optional)
              </Label>
              <Input
                id="alertName"
                placeholder="e.g., AAPL Breakout Alert"
                {...register("alertName")}
                className="w-full h-12 bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500">
                Leave empty to auto-generate a name from the symbol and type.
              </p>
            </div>

            {/* Alert Type */}
            <SelectField
              name="alertType"
              label="Alert Type *"
              placeholder="Select alert type"
              options={ALERT_TYPE_OPTIONS}
              control={control}
              error={errors.alertType}
              required
            />

            {/* Advanced Alert Options - Pro Only */}
            {hasAdvancedFeatures && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="alertSubType" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    Alert Method <span className="text-xs text-yellow-500">(Pro)</span>
                  </Label>
                  <SelectField
                    name="alertSubType"
                    label=""
                    placeholder="Select alert method"
                    options={[
                      { value: "price", label: "Price Threshold" },
                      { value: "percentage", label: "Percentage Change" },
                      { value: "volume", label: "Volume Spike" },
                      { value: "technical", label: "Technical Indicator" },
                    ]}
                    control={control}
                    error={errors.alertSubType}
                  />
                </div>

                {alertSubType === "technical" && (
                  <div className="p-4 bg-gray-800/50 border border-yellow-500/30 rounded-lg space-y-4">
                    <div className="flex items-center gap-2 text-sm text-yellow-400">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-medium">Technical Indicator Alert (Coming Soon)</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Configure alerts based on technical indicators like RSI, Moving Averages, or MACD signals.
                    </p>
                  </div>
                )}
              </>
            )}

            {!hasAdvancedFeatures && (
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-300">Advanced Alert Types</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUpgradeDialogOpen(true)}
                    className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                  >
                    Upgrade to Pro
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Unlock percentage change alerts, volume alerts, and technical indicator alerts with Pro plan.
                </p>
              </div>
            )}

            {/* Current Price Display */}
            {currentPrice && (
              <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Current Price</p>
                <p className="text-2xl font-bold text-white">${currentPrice.toFixed(2)}</p>
              </div>
            )}

            {/* Price/Volume Threshold */}
            {(alertSubType === "price" || alertSubType === "volume") && (
              <div className="space-y-2">
                <Label htmlFor="threshold" className="text-sm font-medium text-gray-300">
                  {alertSubType === "volume" ? "Volume Threshold (shares) *" : "Price Threshold ($) *"}
                </Label>
              <Input
                id="threshold"
                type="number"
                step={alertSubType === "volume" ? "1000" : "0.01"}
                min="0"
                placeholder={alertSubType === "volume" ? "Enter volume threshold" : "Enter target price"}
                {...register("threshold", {
                  required: alertSubType === "price" || alertSubType === "volume" ? "Threshold is required" : false,
                  min: {
                    value: alertSubType === "volume" ? 1 : 0.01,
                    message: "Threshold must be greater than 0",
                  },
                  valueAsNumber: true,
                  validate: (value) => {
                    if ((alertSubType === "price" || alertSubType === "volume") && (!value || value <= 0)) {
                      return "Threshold must be greater than 0";
                    }
                    return true;
                  },
                })}
                className="w-full h-12 bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
                {errors.threshold && (
                  <p className="text-sm text-red-400">{errors.threshold.message}</p>
                )}
                {currentPrice && threshold && threshold > 0 && alertSubType === "price" && (
                  <p className="text-xs text-gray-500">
                    {alertType === "upper" ? (
                      threshold > currentPrice ? (
                        <span className="text-green-400">
                          Alert will trigger when price reaches ${threshold.toFixed(2)} (${(
                            ((threshold - currentPrice) / currentPrice) *
                            100
                          ).toFixed(1)}% above current)
                        </span>
                      ) : (
                        <span className="text-yellow-400">
                          Warning: Threshold (${threshold.toFixed(2)}) is below current price. Alert will trigger immediately.
                        </span>
                      )
                    ) : (
                      threshold < currentPrice ? (
                        <span className="text-green-400">
                          Alert will trigger when price drops to ${threshold.toFixed(2)} (${(
                            ((currentPrice - threshold) / currentPrice) *
                            100
                          ).toFixed(1)}% below current)
                        </span>
                      ) : (
                        <span className="text-yellow-400">
                          Warning: Threshold (${threshold.toFixed(2)}) is above current price. Alert will trigger immediately.
                        </span>
                      )
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Percentage Threshold */}
            {alertSubType === "percentage" && (
              <div className="space-y-2">
                <Label htmlFor="percentageThreshold" className="text-sm font-medium text-gray-300">
                  Percentage Change (%) *
                </Label>
                <Input
                  id="percentageThreshold"
                  type="number"
                  step="0.1"
                  min="-100"
                  max="1000"
                  placeholder={alertType === "upper" ? "e.g., 5 (for +5% increase)" : "e.g., -3 (for -3% decrease)"}
                  {...register("percentageThreshold", {
                    required: "Percentage threshold is required",
                    min: {
                      value: -100,
                      message: "Percentage must be at least -100%",
                    },
                    max: {
                      value: 1000,
                      message: "Percentage cannot exceed 1000%",
                    },
                    valueAsNumber: true,
                  })}
                  className="w-full h-12 bg-gray-800 border-gray-600 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {errors.percentageThreshold && (
                  <p className="text-sm text-red-400">{errors.percentageThreshold.message}</p>
                )}
                {currentPrice && percentageThreshold !== undefined && (
                  <p className="text-xs text-gray-500">
                    {alertType === "upper" ? (
                      <span className="text-green-400">
                        Alert will trigger when {symbol} moves {percentageThreshold > 0 ? "+" : ""}{percentageThreshold.toFixed(1)}% 
                        ({percentageThreshold > 0 ? "above" : "to"} ${(currentPrice * (1 + percentageThreshold / 100)).toFixed(2)})
                      </span>
                    ) : (
                      <span className="text-green-400">
                        Alert will trigger when {symbol} moves {percentageThreshold < 0 ? "" : "-"}{Math.abs(percentageThreshold).toFixed(1)}% 
                        (to ${(currentPrice * (1 + percentageThreshold / 100)).toFixed(2)})
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

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
                    Creating...
                  </>
                ) : (
                  "Create Alert"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        reason={upgradeReason}
      />
    </>
  );
}

