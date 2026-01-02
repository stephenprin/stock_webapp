import { Schema, model, models, type Document, type Model } from "mongoose";

export type AlertSubType = "price" | "percentage" | "volume" | "technical";
export type TechnicalIndicatorType = "RSI" | "MA" | "MACD";
export type ConditionOperator = ">" | "<" | ">=" | "<=" | "==";
export type ConditionLogic = "AND" | "OR";

export interface Condition {
  type: "price" | "volume" | "percentage";
  operator: ConditionOperator;
  value: number;
}

export interface TechnicalIndicatorConfig {
  type: TechnicalIndicatorType;
  period?: number;
  threshold?: number;
  crossover?: "golden" | "death";
}

export interface PriceAlert extends Document {
  userId: string;
  symbol: string;
  company: string;
  alertName: string;
  alertType: "upper" | "lower";
  alertSubType: AlertSubType;
  threshold?: number;
  conditions?: Condition[];
  conditionLogic?: ConditionLogic;
  technicalIndicator?: TechnicalIndicatorConfig;
  percentageThreshold?: number;
  previousDayClose?: number;
  isActive: boolean;
  triggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConditionSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["price", "volume", "percentage"],
    },
    operator: {
      type: String,
      required: true,
      enum: [">", "<", ">=", "<=", "=="],
    },
    value: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const TechnicalIndicatorConfigSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["RSI", "MA", "MACD"],
    },
    period: {
      type: Number,
      default: null,
    },
    threshold: {
      type: Number,
      default: null,
    },
    crossover: {
      type: String,
      enum: ["golden", "death"],
      default: null,
    },
  },
  { _id: false }
);

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
    alertSubType: {
      type: String,
      required: true,
      enum: ["price", "percentage", "volume", "technical"],
      default: "price",
    },
    threshold: {
      type: Number,
      required: false,
      min: 0,
    },
    conditions: {
      type: [ConditionSchema],
      required: false,
    },
    conditionLogic: {
      type: String,
      enum: ["AND", "OR"],
      default: "AND",
      required: false,
    },
    technicalIndicator: {
      type: TechnicalIndicatorConfigSchema,
      required: false,
    },
    percentageThreshold: {
      type: Number,
      required: false,
      min: -100,
      max: 1000,
    },
    previousDayClose: {
      type: Number,
      default: undefined,
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

PriceAlertSchema.index({ userId: 1, symbol: 1, alertType: 1, alertSubType: 1, alertName: 1 }, { unique: true });

PriceAlertSchema.index({ userId: 1, isActive: 1 });

PriceAlertSchema.index({ isActive: 1 });

export const PriceAlertModel: Model<PriceAlert> =
  (models?.PriceAlert as Model<PriceAlert>) ||
  model<PriceAlert>("PriceAlert", PriceAlertSchema);

