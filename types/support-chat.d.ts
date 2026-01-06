export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  state?: "sending" | "sent" | "error";
}

export interface PortfolioHoldingSummary {
  symbol: string;
  quantity: number;
  averageCost: number;
  currentPrice?: number;
  marketValue?: number;
  gainLoss?: number;
  gainLossPercent?: number;
  sector?: string;
  industry?: string;
}

export interface ChatContext {
  subscriptionPlan: "free" | "pro" | "enterprise";
  portfolioHoldingsCount: number;
  portfolioHoldings?: PortfolioHoldingSummary[];
  portfolioTotalValue?: number;
  portfolioTotalCost?: number;
  portfolioTotalGainLoss?: number;
  portfolioTotalGainLossPercent?: number;
  activeAlertsCount: number;
  faqKnowledge: string;
}

export interface ChatResponse {
  message: string;
  error?: string;
}

