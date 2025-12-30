"use client";

import { useState } from "react";
import { PortfolioHolding } from "@/database/models/portfolio-holding.model";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreVertical, TrendingUp, TrendingDown, Trash2, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { removePosition } from "@/lib/actions/portfolio.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import EditPositionDialog from "./EditPositionDialog";
import SellPositionDialog from "./SellPositionDialog";
import { formatCurrency, formatPercent } from "@/lib/utils/utils";

interface PortfolioHoldingsTableProps {
  holdings: PortfolioHolding[];
  onPositionUpdated?: () => void;
}

export default function PortfolioHoldingsTable({
  holdings,
  onPositionUpdated,
}: PortfolioHoldingsTableProps) {
  const [editingHolding, setEditingHolding] = useState<PortfolioHolding | null>(null);
  const [sellingHolding, setSellingHolding] = useState<PortfolioHolding | null>(null);
  const router = useRouter();

  const handleRemove = async (symbol: string) => {
    if (!confirm(`Are you sure you want to remove ${symbol} from your portfolio?`)) {
      return;
    }

    const result = await removePosition(symbol);
    
    if (result.success) {
      toast.success(result.message || "Position removed");
      onPositionUpdated?.();
    } else {
      toast.error(result.error || "Failed to remove position");
    }
  };

 

  return (
    <>
      <div className="rounded-md border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700 hover:bg-gray-800/50">
              <TableHead className="text-gray-400 font-medium">Symbol</TableHead>
              <TableHead className="text-gray-400 font-medium">Company</TableHead>
              <TableHead className="text-gray-400 font-medium text-right">
                Quantity
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-right">
                Avg Cost
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-right">
                Current Price
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-right">
                Market Value
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-right">
                Gain/Loss
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-right">
                %
              </TableHead>
              <TableHead className="text-gray-400 font-medium text-center w-[50px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding) => {
              const gainLoss = holding.gainLoss || 0;
              const gainLossPercent = holding.gainLossPercent || 0;
              const isPositive = gainLoss >= 0;

              return (
                <TableRow
                  key={holding._id?.toString() || holding.symbol}
                  className="border-gray-700 hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => router.push(`/search?symbol=${holding.symbol}`)}
                >
                  <TableCell className="font-semibold text-white">
                    {holding.symbol}
                  </TableCell>
                  <TableCell className="text-gray-300">
                    {holding.companyName}
                  </TableCell>
                  <TableCell className="text-right text-gray-300">
                    {holding.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-gray-300">
                    {formatCurrency(holding.averageCost)}
                  </TableCell>
                  <TableCell className="text-right text-white font-medium">
                    {holding.currentPrice
                      ? formatCurrency(holding.currentPrice)
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right text-white font-medium">
                    {holding.marketValue
                      ? formatCurrency(holding.marketValue)
                      : "N/A"}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      isPositive ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatCurrency(gainLoss)}
                    </div>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      isPositive ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {formatPercent(gainLossPercent)}
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
                        >
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                        <DropdownMenuItem
                          className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                          onClick={() => setEditingHolding(holding)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Position
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                          onClick={() => setSellingHolding(holding)}
                        >
                          <TrendingDown className="h-4 w-4 mr-2" />
                          Sell Shares
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400 hover:bg-gray-700 cursor-pointer"
                          onClick={() => handleRemove(holding.symbol)}
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

      {editingHolding && (
        <EditPositionDialog
          holding={editingHolding}
          open={!!editingHolding}
          onOpenChange={(open) => !open && setEditingHolding(null)}
          onPositionUpdated={() => {
            setEditingHolding(null);
            onPositionUpdated?.();
          }}
        />
      )}

      {sellingHolding && (
        <SellPositionDialog
          holding={sellingHolding}
          open={!!sellingHolding}
          onOpenChange={(open) => !open && setSellingHolding(null)}
          onPositionUpdated={() => {
            setSellingHolding(null);
            onPositionUpdated?.();
          }}
        />
      )}
    </>
  );
}

