import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface OTP extends Document {
  email: string;
  code: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

const OTPSchema = new Schema<OTP>(
  {
    email: { type: String, required: true, index: true, lowercase: true },
    code: { type: String, required: true, length: 6 },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Auto-delete expired OTPs
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTPModel: Model<OTP> =
  (models?.OTP as Model<OTP>) || model<OTP>('OTP', OTPSchema);

