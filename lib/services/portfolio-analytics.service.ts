export interface PortfolioHoldingPlain {
  _id?: string;
  userId: string;
  symbol: string;
  companyName: string;
  exchange?: string;
  quantity: number;
  averageCost: number;
  totalCost: number;
  currentPrice?: number;
  marketValue?: number;
  gainLoss?: number;
  gainLossPercent?: number;
  lastUpdated?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioSummary {
  totalCost: number;
  totalMarketValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayGainLoss?: number;
  dayGainLossPercent?: number;
  holdingsCount: number;
  positions: PortfolioHoldingPlain[];
}

export interface AssetAllocation {
  symbol: string;
  companyName: string;
  marketValue: number;
  percentage: number;
  quantity: number;
  averageCost: number;
  currentPrice?: number;
  gainLoss?: number;
  gainLossPercent?: number;
}

export interface PerformanceMetric {
  date: string;
  totalValue: number;
  totalCost: number;
  gainLoss: number;
  gainLossPercent: number;
}


export function calculatePortfolioSummary(
  holdings: PortfolioHoldingPlain[]
): PortfolioSummary {
  if (holdings.length === 0) {
    return {
      totalCost: 0,
      totalMarketValue: 0,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      holdingsCount: 0,
      positions: [],
    };
  }

  const totalCost = holdings.reduce((sum, h) => sum + (h.totalCost || 0), 0);
  const totalMarketValue = holdings.reduce(
    (sum, h) => sum + (h.marketValue || 0),
    0
  );
  const totalGainLoss = totalMarketValue - totalCost;
  const totalGainLossPercent =
    totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  return {
    totalCost,
    totalMarketValue,
    totalGainLoss,
    totalGainLossPercent,
    holdingsCount: holdings.length,
    positions: holdings,
  };
}


export function calculateAssetAllocation(
  holdings: PortfolioHoldingPlain[]
): AssetAllocation[] {
  const totalValue = holdings.reduce(
    (sum, h) => sum + (h.marketValue || 0),
    0
  );

  if (totalValue === 0) return [];

  return holdings
    .map((holding) => ({
      symbol: holding.symbol,
      companyName: holding.companyName,
      marketValue: holding.marketValue || 0,
      percentage: ((holding.marketValue || 0) / totalValue) * 100,
      quantity: holding.quantity,
      averageCost: holding.averageCost,
      currentPrice: holding.currentPrice,
      gainLoss: holding.gainLoss,
      gainLossPercent: holding.gainLossPercent,
    }))
    .sort((a, b) => b.marketValue - a.marketValue);
}

export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}


export function formatPercent(value: number, decimals: number = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}


export function calculateNewAverageCost(
  currentQuantity: number,
  currentAverageCost: number,
  newQuantity: number,
  newPrice: number,
  fees: number = 0
): number {
  const currentTotalCost = currentQuantity * currentAverageCost;
  const newTotalCost = newQuantity * newPrice + fees;
  const totalQuantity = currentQuantity + newQuantity;

  if (totalQuantity === 0) return 0;

  return (currentTotalCost + newTotalCost) / totalQuantity;
}


export function validateTransaction(
  transactionType: 'buy' | 'sell',
  currentQuantity: number,
  sellQuantity: number
): { valid: boolean; error?: string } {
  if (transactionType === 'sell' && sellQuantity > currentQuantity) {
    return {
      valid: false,
      error: `Cannot sell ${sellQuantity} shares. You only have ${currentQuantity} shares.`,
    };
  }

  if (sellQuantity <= 0) {
    return {
      valid: false,
      error: 'Quantity must be greater than 0',
    };
  }

  return { valid: true };
}

