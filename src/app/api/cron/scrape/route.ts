import { NextRequest, NextResponse } from "next/server";
import { runPipeline, reverifyExistingJobs } from "@/lib/automation/pipeline";

// Vercel cron jobs use this secret to authenticate
const CRON_SECRET = process.env.CRON_SECRET;

// GET /api/cron/scrape
//
// Runs the full job pipeline: scrape new jobs + re-verify existing jobs.
// Combined into one endpoint for Vercel Hobby plan (1 cron limit).
// Schedule: Daily at midnight UTC (0 0 * * *)
export async function GET(request: NextRequest) {
  // Verify cron secret if configured
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  console.log("Starting daily job pipeline...");

  try {
    // Step 1: Scrape and verify new jobs
    console.log("Step 1: Scraping new jobs...");
    const scrapeResult = await runPipeline();

    // Step 2: Re-verify existing jobs
    console.log("Step 2: Re-verifying existing jobs...");
    const verifyResult = await reverifyExistingJobs();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      scrape: scrapeResult,
      reverify: verifyResult,
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
