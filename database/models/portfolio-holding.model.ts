import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface PortfolioHolding extends Document {
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
  gainLossPercent?: number; // (gainLoss / totalCost) * 100
  lastUpdated?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioHoldingSchema = new Schema<PortfolioHolding>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    exchange: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    averageCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number, min: 0 },
    marketValue: { type: Number, min: 0 },
    gainLoss: { type: Number },
    gainLossPercent: { type: Number },
    lastUpdated: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);


PortfolioHoldingSchema.index({ userId: 1, symbol: 1 }, { unique: true });

PortfolioHoldingSchema.index({ userId: 1, createdAt: -1 });

export const PortfolioHoldingModel: Model<PortfolioHolding> =
  (models?.PortfolioHolding as Model<PortfolioHolding>) ||
  model<PortfolioHolding>('PortfolioHolding', PortfolioHoldingSchema);

