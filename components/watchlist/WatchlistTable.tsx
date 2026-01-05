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
import { MoreVertical, TrendingUp, TrendingDown, Trash2, Bell, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatCurrency, formatPercent } from "@/lib/utils/utils";
import CreateAlertDialog from "@/components/alerts/CreateAlertDialog";

export default function WatchlistTable({
  watchlist,
  onWatchlistUpdated,
}: WatchlistTableProps & { onWatchlistUpdated?: () => void }) {
  const [removingSymbol, setRemovingSymbol] = useState<string | null>(null);
  const [createAlertDialogOpen, setCreateAlertDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{ symbol: string; company: string } | null>(null);
  const router = useRouter();

  const handleRemove = async (symbol: string, company: string) => {
    if (!confirm(`Are you sure you want to remove ${symbol} (${company}) from your watchlist?`)) {
      return;
    }

    setRemovingSymbol(symbol);
    try {
      const result = await removeFromWatchlist(symbol);
      
      if (result.success) {
        toast.success(result.message || `${symbol} removed from watchlist`);
        onWatchlistUpdated?.();
      } else {
        toast.error(result.error || "Failed to remove from watchlist");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setRemovingSymbol(null);
    }
  };

  const handleCreateAlert = (stock: StockWithData) => {
    setSelectedStock({
      symbol: stock.symbol,
      company: stock.company,
    });
    setCreateAlertDialogOpen(true);
  };

  const handleViewStock = (symbol: string) => {
    router.push(`/search?symbol=${symbol}`);
  };

  if (!watchlist || watchlist.length === 0) {
    return null;
  }

  return (
    <>
      <div className="watchlist-table">
        <Table>
          <TableHeader>
            <TableRow className="table-header-row">
              <TableHead className="table-header text-gray-400 font-medium">Company</TableHead>
              <TableHead className="table-header text-gray-400 font-medium">Symbol</TableHead>
              <TableHead className="table-header text-gray-400 font-medium text-right">Price</TableHead>
              <TableHead className="table-header text-gray-400 font-medium text-right">Change</TableHead>
              <TableHead className="table-header text-gray-400 font-medium text-right">Market Cap</TableHead>
              <TableHead className="table-header text-gray-400 font-medium text-right">P/E Ratio</TableHead>
              <TableHead className="table-header text-gray-400 font-medium text-center">Alert</TableHead>
              <TableHead className="table-header text-gray-400 font-medium text-center w-[50px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {watchlist.map((stock) => {
              const changePercent = stock.changePercent || 0;
              const isPositive = changePercent >= 0;
              const isRemoving = removingSymbol === stock.symbol;

              return (
                <TableRow
                  key={stock.symbol}
                  className="table-row"
                  onClick={() => handleViewStock(stock.symbol)}
                >
                  <TableCell className="table-cell text-gray-100">
                    {stock.company}
                  </TableCell>
                  <TableCell className="table-cell font-semibold text-white">
                    {stock.symbol}
                  </TableCell>
                  <TableCell className="table-cell text-right text-white font-medium">
                    {stock.priceFormatted || (stock.currentPrice ? formatCurrency(stock.currentPrice) : "N/A")}
                  </TableCell>
                  <TableCell
                    className={`table-cell text-right font-medium ${
                      isPositive ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {stock.changeFormatted || formatPercent(changePercent)}
                    </div>
                  </TableCell>
                  <TableCell className="table-cell text-right text-gray-300">
                    {stock.marketCap || "N/A"}
                  </TableCell>
                  <TableCell className="table-cell text-right text-gray-300">
                    {stock.peRatio || "N/A"}
                  </TableCell>
                  <TableCell
                    className="table-cell text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="add-alert"
                      onClick={() => handleCreateAlert(stock)}
                    >
                      <Bell className="h-4 w-4" />
                      Alert
                    </Button>
                  </TableCell>
                  <TableCell
                    className="table-cell text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-700"
                          disabled={isRemoving}
                        >
                          {isRemoving ? (
                            <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                        <DropdownMenuItem
                          className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleViewStock(stock.symbol)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleCreateAlert(stock)}
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          Create Alert
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400 hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleRemove(stock.symbol, stock.company)}
                          disabled={isRemoving}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
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

      {selectedStock && (
        <CreateAlertDialog
          open={createAlertDialogOpen}
          onOpenChange={(open) => {
            setCreateAlertDialogOpen(open);
            if (!open) {
              setSelectedStock(null);
            }
          }}
          onAlertCreated={() => {
            setCreateAlertDialogOpen(false);
            setSelectedStock(null);
          }}
          defaultSymbol={selectedStock.symbol}
          defaultCompany={selectedStock.company}
        />
      )}
    </>
  );
}

