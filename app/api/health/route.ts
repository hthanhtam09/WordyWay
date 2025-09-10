import { NextResponse } from "next/server";
import { getConnectionStatus } from "@/lib/mongoose";

export async function GET() {
  try {
    const dbStatus = await getConnectionStatus();

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        vercel: process.env.VERCEL_ENV || "local",
        database: dbStatus,
      },
      {
        status: dbStatus.isConnected ? 200 : 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        vercel: process.env.VERCEL_ENV || "local",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  }
}
