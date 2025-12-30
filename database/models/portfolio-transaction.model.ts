import { Schema, model, models, type Document, type Model } from 'mongoose';

export type TransactionType = 'buy' | 'sell' | 'dividend' | 'split' | 'transfer';

export interface PortfolioTransaction extends Document {
  userId: string;
  symbol: string;
  transactionType: TransactionType;
  quantity: number;
  price: number; 
  totalAmount: number; 
  fees?: number; 
  date: Date; 
  notes?: string;
  holdingId?: string; 
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioTransactionSchema = new Schema<PortfolioTransaction>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    transactionType: {
      type: String,
      required: true,
      enum: ['buy', 'sell', 'dividend', 'split', 'transfer'],
    },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true },
    fees: { type: Number, min: 0, default: 0 },
    date: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    holdingId: { type: String },
  },
  { timestamps: true }
);

// Indexes for efficient queries
PortfolioTransactionSchema.index({ userId: 1, date: -1 });
PortfolioTransactionSchema.index({ userId: 1, symbol: 1, date: -1 });
PortfolioTransactionSchema.index({ userId: 1, transactionType: 1 });

export const PortfolioTransactionModel: Model<PortfolioTransaction> =
  (models?.PortfolioTransaction as Model<PortfolioTransaction>) ||
  model<PortfolioTransaction>('PortfolioTransaction', PortfolioTransactionSchema);

