"use server";

import { connectToDatabase } from "@/database/mongoose";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { PortfolioHoldingModel } from "@/database/models/portfolio-holding.model";
import { PortfolioTransactionModel, type TransactionType } from "@/database/models/portfolio-transaction.model";
import { getStockQuote, getStockQuotesBatch } from "./finnhub.actions";
import {
  calculatePortfolioSummary,
  calculateAssetAllocation,
  calculateNewAverageCost,
  validateTransaction,
  type PortfolioSummary,
  type AssetAllocation,
} from "@/lib/services/portfolio-analytics.service";
import { searchStocks } from "./finnhub.actions";
import { enforceStockLimit } from "@/lib/utils/subscription";


export async function getPortfolioHoldings(): Promise<{
  success: boolean;
  holdings?: PortfolioHolding[];
  summary?: PortfolioSummary;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        error: "You must be logged in to view your portfolio",
      };
    }

    await connectToDatabase();
    const userId = session.user.id;

    let holdings = await PortfolioHoldingModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    if (holdings.length === 0) {
      return {
        success: true,
        holdings: [],
        summary: calculatePortfolioSummary([]),
      };
    }

    const symbols = holdings.map((h) => h.symbol);
    const quotes = await getStockQuotesBatch(symbols);

    // Update holdings with current prices and calculate P&L
    const updatedHoldings = holdings.map((holding) => {
      const quote = quotes.get(holding.symbol);
      const currentPrice = quote?.currentPrice || holding.currentPrice || 0;
      const marketValue = holding.quantity * currentPrice;
      const gainLoss = marketValue - holding.totalCost;
      const gainLossPercent =
        holding.totalCost > 0 ? (gainLoss / holding.totalCost) * 100 : 0;

      
      const holdingObj = {
        ...holding,
        _id: (holding._id.toString())?.toString() || String((holding as any)._id),
        currentPrice,
        marketValue,
        gainLoss,
        gainLossPercent,
        lastUpdated: new Date(),
      };

      return holdingObj;
    });

    // Update database with latest prices (using original _id)
    PortfolioHoldingModel.bulkWrite(
      holdings.map((h, index) => ({
        updateOne: {
          filter: { _id: h._id, userId },
          update: {
            $set: {
              currentPrice: updatedHoldings[index].currentPrice,
              marketValue: updatedHoldings[index].marketValue,
              gainLoss: updatedHoldings[index].gainLoss,
              gainLossPercent: updatedHoldings[index].gainLossPercent,
              lastUpdated: updatedHoldings[index].lastUpdated,
            },
          },
        },
      }))
    ).catch((err) => console.error("Error updating holdings prices:", err));

    const summary = calculatePortfolioSummary(updatedHoldings as any);

    return {
      success: true,
      holdings: updatedHoldings as any,
      summary,
    };
  } catch (error: any) {
    console.error("Error fetching portfolio holdings:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch portfolio holdings",
    };
  }
}


export async function addPosition(data: {
  symbol: string;
  companyName: string;
  quantity: number;
  price: number;
  fees?: number;
  exchange?: string;
  notes?: string;
  date?: Date;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  holding?: PortfolioHolding;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        error: "You must be logged in to add positions",
      };
    }

    await connectToDatabase();
    const userId = session.user.id;

    if (data.quantity <= 0 || data.price <= 0) {
      return {
        success: false,
        error: "Quantity and price must be greater than 0",
      };
    }

    // Check if this is a new stock symbol (not an existing holding)
    const existingHolding = await PortfolioHoldingModel.findOne({
      userId,
      symbol: data.symbol.toUpperCase(),
    });

    // If adding a new stock (not updating existing), check subscription limit
    if (!existingHolding) {
      const currentStockCount = await PortfolioHoldingModel.countDocuments({ userId });
      const limitCheck = await enforceStockLimit(userId, currentStockCount);
      
      if (!limitCheck.allowed) {
        return {
          success: false,
          error: limitCheck.reason || "Stock limit reached",
          message: limitCheck.reason,
        };
      }
    }

    const totalCost = data.quantity * data.price + (data.fees || 0);

    if (existingHolding) {
      const newQuantity = existingHolding.quantity + data.quantity;
      const newAverageCost = calculateNewAverageCost(
        existingHolding.quantity,
        existingHolding.averageCost,
        data.quantity,
        data.price,
        data.fees || 0
      );
      const newTotalCost = existingHolding.totalCost + totalCost;

      // Fetch current price
      const quote = await getStockQuote(data.symbol);
      const currentPrice = quote?.currentPrice || data.price;

      existingHolding.quantity = newQuantity;
      existingHolding.averageCost = newAverageCost;
      existingHolding.totalCost = newTotalCost;
      existingHolding.currentPrice = currentPrice;
      existingHolding.marketValue = newQuantity * currentPrice;
      existingHolding.gainLoss =
        existingHolding.marketValue - existingHolding.totalCost;
      existingHolding.gainLossPercent =
        existingHolding.totalCost > 0
          ? (existingHolding.gainLoss / existingHolding.totalCost) * 100
          : 0;
      existingHolding.lastUpdated = new Date();

      if (data.notes) {
        existingHolding.notes = data.notes;
      }

      await existingHolding.save();
    } else {
      const quote = await getStockQuote(data.symbol);
      const currentPrice = quote?.currentPrice || data.price;
      const marketValue = data.quantity * currentPrice;
      const gainLoss = marketValue - totalCost;
      const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

      const newHolding = new PortfolioHoldingModel({
        userId,
        symbol: data.symbol.toUpperCase(),
        companyName: data.companyName,
        exchange: data.exchange,
        quantity: data.quantity,
        averageCost: data.price,
        totalCost,
        currentPrice,
        marketValue,
        gainLoss,
        gainLossPercent,
        lastUpdated: new Date(),
        notes: data.notes,
      });

      await newHolding.save();
    }

    // Create transaction record
    const transaction = new PortfolioTransactionModel({
      userId,
      symbol: data.symbol.toUpperCase(),
      transactionType: "buy" as TransactionType,
      quantity: data.quantity,
      price: data.price,
      totalAmount: totalCost,
      fees: data.fees || 0,
      date: data.date || new Date(),
      notes: data.notes,
    });

    await transaction.save();

    return {
      success: true,
      message: `Successfully added ${data.quantity} shares of ${data.symbol.toUpperCase()}`,
    };
  } catch (error: any) {
    console.error("Error adding position:", error);
    return {
      success: false,
      error: error.message || "Failed to add position",
    };
  }
}


export async function sellPosition(data: {
  symbol: string;
  quantity: number;
  price: number;
  fees?: number;
  date?: Date;
  notes?: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        error: "You must be logged in to sell positions",
      };
    }

    await connectToDatabase();
    const userId = session.user.id;

    const holding = await PortfolioHoldingModel.findOne({
      userId,
      symbol: data.symbol.toUpperCase(),
    });

    if (!holding) {
      return {
        success: false,
        error: `You don't have any shares of ${data.symbol.toUpperCase()}`,
      };
    }

    const validation = validateTransaction("sell", holding.quantity, data.quantity);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const totalProceeds = data.quantity * data.price - (data.fees || 0);
    const costBasis = (data.quantity / holding.quantity) * holding.totalCost;
    const realizedGainLoss = totalProceeds - costBasis;

    // Update holding
    const newQuantity = holding.quantity - data.quantity;
    
    if (newQuantity === 0) {
      await PortfolioHoldingModel.deleteOne({ _id: holding._id });
    } else {
      holding.quantity = newQuantity;
      holding.totalCost = holding.totalCost - costBasis;
      holding.averageCost = holding.totalCost / newQuantity;

      const quote = await getStockQuote(data.symbol);
      const currentPrice = quote?.currentPrice || data.price;
      holding.currentPrice = currentPrice;
      holding.marketValue = newQuantity * currentPrice;
      holding.gainLoss = holding.marketValue - holding.totalCost;
      holding.gainLossPercent =
        holding.totalCost > 0
          ? (holding.gainLoss / holding.totalCost) * 100
          : 0;
      holding.lastUpdated = new Date();

      await holding.save();
    }

    // Create transaction record
    const transaction = new PortfolioTransactionModel({
      userId,
      symbol: data.symbol.toUpperCase(),
      transactionType: "sell" as TransactionType,
      quantity: data.quantity,
      price: data.price,
      totalAmount: totalProceeds,
      fees: data.fees || 0,
      date: data.date || new Date(),
      notes: data.notes,
      holdingId: holding._id.toString(),
    });

    await transaction.save();

    return {
      success: true,
      message: `Sold ${data.quantity} shares of ${data.symbol.toUpperCase()}. ${realizedGainLoss >= 0 ? "Gain" : "Loss"}: ${realizedGainLoss >= 0 ? "+" : ""}${realizedGainLoss.toFixed(2)}`,
    };
  } catch (error: any) {
    console.error("Error selling position:", error);
    return {
      success: false,
      error: error.message || "Failed to sell position",
    };
  }
}

export async function removePosition(symbol: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        error: "You must be logged in to remove positions",
      };
    }

    await connectToDatabase();
    const userId = session.user.id;

    const result = await PortfolioHoldingModel.deleteOne({
      userId,
      symbol: symbol.toUpperCase(),
    });

    if (result.deletedCount === 0) {
      return {
        success: false,
        error: `Position ${symbol.toUpperCase()} not found in your portfolio`,
      };
    }

    return {
      success: true,
      message: `Removed ${symbol.toUpperCase()} from portfolio`,
    };
  } catch (error: any) {
    console.error("Error removing position:", error);
    return {
      success: false,
      error: error.message || "Failed to remove position",
    };
  }
}

export async function getAssetAllocation(): Promise<{
  success: boolean;
  allocation?: AssetAllocation[];
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        error: "You must be logged in to view asset allocation",
      };
    }

    const portfolioResult = await getPortfolioHoldings();
    
    if (!portfolioResult.success || !portfolioResult.holdings) {
      return {
        success: false,
        error: portfolioResult.error || "Failed to fetch portfolio",
      };
    }

    const allocation = calculateAssetAllocation(portfolioResult.holdings);

    return {
      success: true,
      allocation,
    };
  } catch (error: any) {
    console.error("Error calculating asset allocation:", error);
    return {
      success: false,
      error: error.message || "Failed to calculate asset allocation",
    };
  }
}

export async function getTransactionHistory(limit: number = 50): Promise<{
  success: boolean;
  transactions?: PortfolioTransaction[];
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        error: "You must be logged in to view transaction history",
      };
    }

    await connectToDatabase();
    const userId = session.user.id;

    const transactions = await PortfolioTransactionModel.find({ userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    // Convert _id from ObjectId to string
    const formattedTransactions = transactions.map((t) => ({
      ...t,
      _id: (t._id as any)?.toString() || String((t as any)._id),
    }));

    return {
      success: true,
      transactions: formattedTransactions as any,
    };
  } catch (error: any) {
    console.error("Error fetching transaction history:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch transaction history",
    };
  }
}

// Keep existing functions
export async function searchStocksAction(query?: string) {
  try {
    const results = await searchStocks(query);
    return {
      success: true,
      stocks: results,
    };
  } catch (error) {
    console.error("Error searching stocks:", error);
    return {
      success: false,
      error: "Failed to search stocks",
      stocks: [],
    };
  }
}


export async function addStockToPortfolio(symbol: string, companyName?: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        error: "You must be logged in to add stocks to your portfolio",
      };
    }

    // This is a quick-add function - will require user to enter quantity/price later
    // For now, return success with a message prompting for full details
    return {
      success: true,
      message: `${symbol} ready to add. Please use the portfolio page to enter quantity and purchase price.`,
      requiresDetails: true,
    };
  } catch (error: any) {
    console.error("Error adding stock to portfolio:", error);
    return {
      success: false,
      error: error.message || "Failed to add stock to portfolio",
    };
  }
}
