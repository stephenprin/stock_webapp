import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface RateLimit extends Document {
  identifier: string;
  action: string; 
  attempts: number;
  resetAt: Date;
  lockedUntil?: Date; 
  createdAt: Date;
}

const RateLimitSchema = new Schema<RateLimit>(
  {
    identifier: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    attempts: { type: Number, default: 1 },
    resetAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    lockedUntil: { type: Date, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Compound index for fast lookups
RateLimitSchema.index({ identifier: 1, action: 1 });

// Auto-delete expired rate limits
RateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimitModel: Model<RateLimit> =
  (models?.RateLimit as Model<RateLimit>) ||
  model<RateLimit>('RateLimit', RateLimitSchema);

