import { NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";

export async function GET() {
  try {
    await connectToDatabase();

    return NextResponse.json({
      ok: true,
      message: "Successfully connected to MongoDB",
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error("Database connection test failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to connect to MongoDB",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error while connecting to MongoDB",
      },
      { status: 500 }
    );
  }
}
