import { Schema, model, models, type Document, type Model } from "mongoose";

export interface PriceAlert extends Document {
  userId: string;
  symbol: string;
  company: string;
  alertName: string;
  alertType: "upper" | "lower";
  threshold: number;
  isActive: boolean;
  triggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PriceAlertSchema = new Schema<PriceAlert>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    alertName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    alertType: {
      type: String,
      required: true,
      enum: ["upper", "lower"],
    },
    threshold: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    triggeredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

PriceAlertSchema.index({ userId: 1, symbol: 1, alertType: 1 }, { unique: true });

PriceAlertSchema.index({ userId: 1, isActive: 1 });

PriceAlertSchema.index({ isActive: 1 });

export const PriceAlertModel: Model<PriceAlert> =
  (models?.PriceAlert as Model<PriceAlert>) ||
  model<PriceAlert>("PriceAlert", PriceAlertSchema);

