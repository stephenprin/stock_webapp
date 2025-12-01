/* Simple script to test MongoDB connection from Node (TypeScript) */

import mongoose from "mongoose";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local (same as Next.js)
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      "MONGODB_URI is not set. Please export it or load it from an env file."
    );
    process.exit(1);
  }

  console.log("Attempting to connect to MongoDB...");

  try {
    await mongoose.connect(uri, { bufferCommands: false });

    console.log("✅ Successfully connected to MongoDB");
    console.log("NODE_ENV:", process.env.NODE_ENV || "(not set)");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB");
    console.error(err);
    process.exit(1);
  }
}

main();
