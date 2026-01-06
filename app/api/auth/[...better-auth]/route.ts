import { NextRequest } from "next/server";
import { getAuth } from "@/lib/better-auth/auth";

export async function GET(request: NextRequest) {
  const auth = await getAuth();
  return auth.handler(request);
}

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  return auth.handler(request);
}

export async function PUT(request: NextRequest) {
  const auth = await getAuth();
  return auth.handler(request);
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuth();
  return auth.handler(request);
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuth();
  return auth.handler(request);
}

