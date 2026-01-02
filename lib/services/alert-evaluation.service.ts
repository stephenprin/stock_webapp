"use server";

import type {
  AlertSubType,
  Condition,
  ConditionOperator,
  ConditionLogic,
  TechnicalIndicatorConfig,
} from "@/database/models/price-alert.model";
import { getStockQuote } from "@/lib/actions/finnhub.actions";

export interface StockData {
  currentPrice: number;
  volume?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
}

export interface AlertEvaluationResult {
  shouldTrigger: boolean;
  reason?: string;
  evaluatedConditions?: boolean[];
}

function evaluateCondition(
  condition: Condition,
  stockData: StockData
): boolean {
  const { type, operator, value } = condition;

  let actualValue: number | undefined;

  switch (type) {
    case "price":
      actualValue = stockData.currentPrice;
      break;
    case "volume":
      actualValue = stockData.volume;
      break;
    case "percentage":
      if (stockData.previousClose && stockData.currentPrice) {
        actualValue =
          ((stockData.currentPrice - stockData.previousClose) /
            stockData.previousClose) *
          100;
      }
      break;
  }

  if (actualValue === undefined) {
    return false;
  }

  switch (operator) {
    case ">":
      return actualValue > value;
    case "<":
      return actualValue < value;
    case ">=":
      return actualValue >= value;
    case "<=":
      return actualValue <= value;
    case "==":
      return Math.abs(actualValue - value) < 0.01;
    default:
      return false;
  }
}

function evaluateConditions(
  conditions: Condition[],
  logic: ConditionLogic,
  stockData: StockData
): { result: boolean; evaluatedConditions: boolean[] } {
  if (conditions.length === 0) {
    return { result: false, evaluatedConditions: [] };
  }

  const evaluatedConditions = conditions.map((condition) =>
    evaluateCondition(condition, stockData)
  );

  let result: boolean;
  if (logic === "AND") {
    result = evaluatedConditions.every((val) => val === true);
  } else {
    result = evaluatedConditions.some((val) => val === true);
  }

  return { result, evaluatedConditions };
}

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return 0;
  }
  const slice = prices.slice(-period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50;
  }

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const gains = changes.filter((c) => c > 0);
  const losses = changes.filter((c) => c < 0).map((c) => Math.abs(c));

  if (losses.length === 0) {
    return 100;
  }

  const avgGain =
    gains.length > 0
      ? gains.slice(-period).reduce((sum, g) => sum + g, 0) / period
      : 0;
  const avgLoss =
    losses.length > 0
      ? losses.slice(-period).reduce((sum, l) => sum + l, 0) / period
      : 0;

  if (avgLoss === 0) {
    return 100;
  }

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * MACD = EMA(12) - EMA(26)
 * Signal = EMA(9) of MACD
 */
function calculateMACD(prices: number[]): {
  macd: number;
  signal: number;
  histogram: number;
} {
  if (prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  function calculateEMA(prices: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((sum, p) => sum + p, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;

  const macdLine = [macd];
  const signal = calculateEMA(macdLine, 9);
  const histogram = macd - signal;

  return { macd, signal, histogram };
}

function checkMACrossover(
  prices: number[],
  shortPeriod: number,
  longPeriod: number,
  crossoverType: "golden" | "death"
): boolean {
  if (prices.length < longPeriod + 1) {
    return false;
  }

  const shortMA = calculateSMA(prices.slice(-shortPeriod - 1), shortPeriod);
  const longMA = calculateSMA(prices.slice(-longPeriod - 1), longPeriod);
  const prevShortMA = calculateSMA(
    prices.slice(-shortPeriod - 2, -1),
    shortPeriod
  );
  const prevLongMA = calculateSMA(
    prices.slice(-longPeriod - 2, -1),
    longPeriod
  );

  if (crossoverType === "golden") {
    return prevShortMA <= prevLongMA && shortMA > longMA;
  } else {
    return prevShortMA >= prevLongMA && shortMA < longMA;
  }
}

/**
 * Evaluate technical indicator alert
 * Note: This is a simplified implementation. For production, you would need
 * to fetch historical price data from an API that provides candlestick/OHLC data.
 */
async function evaluateTechnicalIndicator(
  config: TechnicalIndicatorConfig,
  symbol: string,
  stockData: StockData
): Promise<boolean> {
  const { type, period = 14, threshold, crossover } = config;

  switch (type) {
    case "RSI": {
      if (threshold === undefined || threshold === null) {
        return false;
      }

      const quote = await getStockQuote(symbol);
      if (!quote) {
        return false;
      }

      const historicalPrices: number[] = [];
      for (let i = 0; i < period + 1; i++) {
        historicalPrices.push(quote.currentPrice);
      }

      const rsi = calculateRSI(historicalPrices, period);

      if (threshold > 0) {
        return rsi >= threshold;
      } else {
        return rsi <= Math.abs(threshold);
      }
    }

    case "MA": {
      if (!crossover) {
        return false;
      }

      const quote = await getStockQuote(symbol);
      if (!quote) {
        return false;
      }

      const shortPeriod = period || 50;
      const longPeriod = period ? period * 2 : 200;

      const historicalPrices: number[] = [];
      for (let i = 0; i < longPeriod + 2; i++) {
        historicalPrices.push(quote.currentPrice);
      }

      return checkMACrossover(historicalPrices, shortPeriod, longPeriod, crossover);
    }

    case "MACD": {
      const quote = await getStockQuote(symbol);
      if (!quote) {
        return false;
      }

      const historicalPrices: number[] = [];
      for (let i = 0; i < 35; i++) {
        historicalPrices.push(quote.currentPrice);
      }

      const { macd, signal } = calculateMACD(historicalPrices);

      if (crossover === "golden") {
        return macd > signal;
      } else if (crossover === "death") {
        return macd < signal;
      }

      return false;
    }

    default:
      return false;
  }
}

export async function evaluateAlert(
  alert: {
    alertSubType: AlertSubType;
    alertType: "upper" | "lower";
    threshold?: number;
    percentageThreshold?: number;
    previousDayClose?: number;
    conditions?: Condition[];
    conditionLogic?: ConditionLogic;
    technicalIndicator?: TechnicalIndicatorConfig;
  },
  symbol: string,
  stockData: StockData
): Promise<AlertEvaluationResult> {
  const { alertSubType, alertType } = alert;

  try {
    switch (alertSubType) {
      case "price": {
        if (alert.threshold === undefined || alert.threshold === null) {
          return { shouldTrigger: false, reason: "Threshold not set" };
        }

        const shouldTrigger =
          alertType === "upper"
            ? stockData.currentPrice >= alert.threshold
            : stockData.currentPrice <= alert.threshold;

        return {
          shouldTrigger,
          reason: shouldTrigger
            ? `Price ${alertType === "upper" ? "above" : "below"} threshold`
            : undefined,
        };
      }

      case "volume": {
        if (alert.threshold === undefined || alert.threshold === null) {
          return { shouldTrigger: false, reason: "Volume threshold not set" };
        }

        if (stockData.volume === undefined) {
          return { shouldTrigger: false, reason: "Volume data not available" };
        }

        const shouldTrigger =
          alertType === "upper"
            ? stockData.volume >= alert.threshold
            : stockData.volume <= alert.threshold;

        return {
          shouldTrigger,
          reason: shouldTrigger
            ? `Volume ${alertType === "upper" ? "above" : "below"} threshold`
            : undefined,
        };
      }

      case "percentage": {
        if (
          alert.percentageThreshold === undefined ||
          alert.percentageThreshold === null
        ) {
          return {
            shouldTrigger: false,
            reason: "Percentage threshold not set",
          };
        }

        if (!alert.previousDayClose) {
          return {
            shouldTrigger: false,
            reason: "Previous day close price not available",
          };
        }

        const percentageChange =
          ((stockData.currentPrice - alert.previousDayClose) /
            alert.previousDayClose) *
          100;

        const shouldTrigger =
          alertType === "upper"
            ? percentageChange >= alert.percentageThreshold
            : percentageChange <= alert.percentageThreshold;

        return {
          shouldTrigger,
          reason: shouldTrigger
            ? `Percentage change ${alertType === "upper" ? "above" : "below"} threshold`
            : undefined,
        };
      }

      case "technical": {
        if (alert.conditions && alert.conditions.length > 0) {
          const logic = alert.conditionLogic || "AND";
          const { result, evaluatedConditions } = evaluateConditions(
            alert.conditions,
            logic,
            stockData
          );

          return {
            shouldTrigger: result,
            reason: result
              ? `Multi-condition alert triggered (${logic})`
              : undefined,
            evaluatedConditions,
          };
        }

        if (alert.technicalIndicator) {
          const result = await evaluateTechnicalIndicator(
            alert.technicalIndicator,
            symbol,
            stockData
          );

          return {
            shouldTrigger: result,
            reason: result
              ? `Technical indicator (${alert.technicalIndicator.type}) triggered`
              : undefined,
          };
        }

        return {
          shouldTrigger: false,
          reason: "No conditions or technical indicator configured",
        };
      }

      default:
        return {
          shouldTrigger: false,
          reason: `Unknown alert subtype: ${alertSubType}`,
        };
    }
  } catch (error) {
    console.error(`Error evaluating alert for ${symbol}:`, error);
    return {
      shouldTrigger: false,
      reason: `Evaluation error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

