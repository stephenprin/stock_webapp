import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { connectToDatabase } from "@/database/mongoose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { error: "Database connection not found" },
        { status: 500 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    const queryConditions: any[] = [
      { userId: userId },
      { "user.id": userId },
      { "user._id": userId }
    ];

    if (userEmail) {
      queryConditions.push(
        { "user.email": userEmail.toLowerCase() },
        { email: userEmail.toLowerCase() }
      );
    }

    const customer = await db.collection("autumn_customers").findOne({
      $or: queryConditions
    });

    const allCustomers = await db.collection("autumn_customers").find({}).limit(10).toArray();

    return NextResponse.json({
      userId,
      userEmail,
      customer: customer ? {
        _id: customer._id,
        userId: customer.userId,
        user: customer.user,
        products: customer.products?.map((p: any) => ({
          id: p.id,
          productId: p.productId,
          name: p.name,
          status: p.status,
          full: p
        })) || [],
        full: customer
      } : null,
      allCustomersSample: allCustomers.map((c: any) => ({
        _id: c._id,
        userId: c.userId,
        user: c.user,
        productCount: c.products?.length || 0,
        products: c.products?.map((p: any) => ({
          id: p.id,
          productId: p.productId,
          name: p.name,
          status: p.status
        })) || []
      })),
      queryConditions
    });
  } catch (error) {
    console.error("Error in subscription debug:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
