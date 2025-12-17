import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/automation/pipeline";

// Vercel cron jobs use this secret to authenticate
const CRON_SECRET = process.env.CRON_SECRET;

// GET /api/cron/scrape
//
// Runs the job scraping and verification pipeline.
// Should be called by Vercel cron or external scheduler.
// Schedule: Every 6 hours (0 */6 * * *)
export async function GET(request: NextRequest) {
  // Verify cron secret if configured
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  console.log("Starting scheduled job scrape...");

  try {
    const result = await runPipeline();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error("Pipeline error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers from admin UI
export async function POST(request: NextRequest) {
  // Check admin password for manual triggers
  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = request.headers.get("x-admin-password");

  if (adminPassword && providedPassword !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return GET(request);
}
