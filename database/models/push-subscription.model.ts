import { Schema, model, models, type Document, type Model } from "mongoose";

export interface PushSubscription extends Document {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<PushSubscription>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

PushSubscriptionSchema.index({ userId: 1 });

export const PushSubscriptionModel: Model<PushSubscription> =
  (models?.PushSubscription as Model<PushSubscription>) ||
  model<PushSubscription>("PushSubscription", PushSubscriptionSchema);

