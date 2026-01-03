import { Schema, model, models, type Document, type Model } from "mongoose";

export type SubscriptionPlan = "free" | "pro" | "enterprise";

export interface UserSubscription extends Document {
  userId: string;
  plan: SubscriptionPlan;
  productId?: string;
  customerId?: string;
  lastSyncedAt: Date;
  updatedAt: Date;
  createdAt: Date;
}

const UserSubscriptionSchema = new Schema<UserSubscription>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      required: true,
      default: "free",
    },
    productId: {
      type: String,
      required: false,
    },
    customerId: {
      type: String,
      required: false,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const UserSubscriptionModel: Model<UserSubscription> =
  models.UserSubscription || model<UserSubscription>("UserSubscription", UserSubscriptionSchema);

