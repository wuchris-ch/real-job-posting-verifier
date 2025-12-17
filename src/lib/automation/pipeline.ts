/**
 * Automation Pipeline - Orchestrates scraping, verification, and database updates
 */

import { createAdminClient } from "@/lib/supabase/server";
import { scrapeAllSources, type ScrapedJob } from "./scraper";
import { verifyJobs, type VerificationResult } from "./verifier";
import { analyzeJobs, type AIAnalysisResult } from "./ai-checker";

export interface PipelineResult {
  scrapedCount: number;
  verifiedCount: number;
  addedCount: number;
  skippedCount: number;
  failedCount: number;
  duration: number;
  errors: string[];
}

interface JobWithAnalysis {
  job: ScrapedJob;
  verification: VerificationResult;
  aiAnalysis: AIAnalysisResult;
}

/**
 * Run the full automation pipeline
 */
export async function runPipeline(): Promise<PipelineResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  console.log("=== Starting Job Automation Pipeline ===");

  // Step 1: Scrape jobs from all sources
  console.log("\n[1/4] Scraping jobs from all sources...");
  let jobs: ScrapedJob[] = [];
  try {
    jobs = await scrapeAllSources();
    console.log(`Scraped ${jobs.length} entry-level tech jobs`);
  } catch (error) {
    errors.push(`Scraping error: ${error}`);
    console.error("Scraping failed:", error);
  }

  if (jobs.length === 0) {
    return {
      scrapedCount: 0,
      verifiedCount: 0,
      addedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      duration: Date.now() - startTime,
      errors,
    };
  }

  // Step 2: Filter out jobs we already have
  console.log("\n[2/4] Checking for existing jobs in database...");
  const supabase = createAdminClient();

  const existingUrls = new Set<string>();
  try {
    const { data: existingJobs } = await supabase
      .from("jobs")
      .select("apply_url, source_url");

    if (existingJobs) {
      existingJobs.forEach((j: { apply_url: string; source_url: string }) => {
        existingUrls.add(j.apply_url);
        existingUrls.add(j.source_url);
      });
    }
  } catch (error) {
    errors.push(`Database check error: ${error}`);
  }

  const newJobs = jobs.filter(
    (j) => !existingUrls.has(j.applyUrl) && !existingUrls.has(j.sourceUrl)
  );
  const skippedCount = jobs.length - newJobs.length;
  console.log(`${newJobs.length} new jobs to process (${skippedCount} already in database)`);

  if (newJobs.length === 0) {
    return {
      scrapedCount: jobs.length,
      verifiedCount: 0,
      addedCount: 0,
      skippedCount,
      failedCount: 0,
      duration: Date.now() - startTime,
      errors,
    };
  }

  // Step 3: Verify URLs and check for red flags
  console.log("\n[3/4] Verifying job listings...");
  let verificationResults: Map<ScrapedJob, VerificationResult>;
  try {
    verificationResults = await verifyJobs(newJobs, 5);
    console.log(`Verified ${verificationResults.size} jobs`);
  } catch (error) {
    errors.push(`Verification error: ${error}`);
    console.error("Verification failed:", error);
    verificationResults = new Map();
  }

  // Filter to only valid jobs
  const validJobs = newJobs.filter((job) => {
    const result = verificationResults.get(job);
    return result?.urlAccessible && !result?.hasRedFlags;
  });
  console.log(`${validJobs.length} jobs passed URL verification`);

  if (validJobs.length === 0) {
    return {
      scrapedCount: jobs.length,
      verifiedCount: 0,
      addedCount: 0,
      skippedCount,
      failedCount: newJobs.length,
      duration: Date.now() - startTime,
      errors,
    };
  }

  // Step 4: AI analysis for remaining jobs
  console.log("\n[4/4] Running AI legitimacy analysis...");
  let aiResults: Map<ScrapedJob, AIAnalysisResult>;
  try {
    aiResults = await analyzeJobs(validJobs, 3);
    console.log(`Analyzed ${aiResults.size} jobs with AI`);
  } catch (error) {
    errors.push(`AI analysis error: ${error}`);
    console.error("AI analysis failed:", error);
    aiResults = new Map();
  }

  // Combine results and filter to approved jobs
  const approvedJobs: JobWithAnalysis[] = validJobs
    .map((job) => ({
      job,
      verification: verificationResults.get(job)!,
      aiAnalysis: aiResults.get(job) || {
        legitimacyScore: 70,
        isLikelyGhostJob: false,
        concerns: [],
        positiveSignals: [],
        recommendation: "REVIEW" as const,
        reasoning: "No AI analysis available",
      },
    }))
    .filter(
      ({ aiAnalysis }) =>
        aiAnalysis.recommendation === "APPROVE" ||
        (aiAnalysis.recommendation === "REVIEW" && aiAnalysis.legitimacyScore >= 60)
    );

  console.log(`${approvedJobs.length} jobs approved for database insertion`);

  // Step 5: Insert approved jobs into database
  let addedCount = 0;
  for (const { job, verification, aiAnalysis } of approvedJobs) {
    try {
      const { error } = await supabase.from("jobs").insert({
        title: job.title,
        company: job.company,
        location: job.location,
        location_type: job.locationType,
        salary_min: job.salaryMin || null,
        salary_max: job.salaryMax || null,
        apply_url: job.applyUrl,
        source_url: job.sourceUrl,
        source: job.source,
        verification_status:
          aiAnalysis.recommendation === "APPROVE" ? "VERIFIED" : "PENDING",
        last_verified_at:
          aiAnalysis.recommendation === "APPROVE"
            ? new Date().toISOString()
            : null,
        verification_notes: `Auto-verified. Score: ${aiAnalysis.legitimacyScore}/100. ${verification.notes}`,
      });

      if (error) {
        errors.push(`Insert error for ${job.title}: ${error.message}`);
      } else {
        addedCount++;
        console.log(`Added: ${job.title} at ${job.company}`);
      }
    } catch (error) {
      errors.push(`Insert error for ${job.title}: ${error}`);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`\n=== Pipeline Complete ===`);
  console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
  console.log(`Added: ${addedCount} jobs`);
  console.log(`Skipped (existing): ${skippedCount}`);
  console.log(`Failed: ${newJobs.length - validJobs.length + (approvedJobs.length - addedCount)}`);

  return {
    scrapedCount: jobs.length,
    verifiedCount: validJobs.length,
    addedCount,
    skippedCount,
    failedCount: newJobs.length - validJobs.length + (approvedJobs.length - addedCount),
    duration,
    errors,
  };
}

/**
 * Re-verify existing jobs and update their status
 */
export async function reverifyExistingJobs(): Promise<{
  checked: number;
  expired: number;
  errors: string[];
}> {
  console.log("=== Re-verifying Existing Jobs ===");
  const errors: string[] = [];

  const supabase = createAdminClient();

  // Get jobs that were verified more than 24 hours ago
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: jobsToCheck, error: fetchError } = await supabase
    .from("jobs")
    .select("*")
    .eq("verification_status", "VERIFIED")
    .lt("last_verified_at", twentyFourHoursAgo);

  if (fetchError) {
    errors.push(`Fetch error: ${fetchError.message}`);
    return { checked: 0, expired: 0, errors };
  }

  if (!jobsToCheck || jobsToCheck.length === 0) {
    console.log("No jobs need re-verification");
    return { checked: 0, expired: 0, errors };
  }

  console.log(`Checking ${jobsToCheck.length} jobs...`);

  let expired = 0;
  for (const job of jobsToCheck) {
    try {
      // Check if URL is still accessible
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(job.apply_url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      });

      clearTimeout(timeoutId);

      if (response.status >= 200 && response.status < 400) {
        // Job still valid, update verification timestamp
        await supabase
          .from("jobs")
          .update({
            last_verified_at: new Date().toISOString(),
            verification_notes: `Re-verified at ${new Date().toISOString()}`,
          })
          .eq("id", job.id);
      } else {
        // Job no longer accessible
        await supabase
          .from("jobs")
          .update({
            verification_status: "BROKEN_LINK",
            verification_notes: `Link broken (HTTP ${response.status}) at ${new Date().toISOString()}`,
          })
          .eq("id", job.id);
        expired++;
      }
    } catch {
      // URL check failed
      await supabase
        .from("jobs")
        .update({
          verification_status: "BROKEN_LINK",
          verification_notes: `Link unreachable at ${new Date().toISOString()}`,
        })
        .eq("id", job.id);
      expired++;
    }

    // Small delay between checks
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`Re-verification complete: ${expired} jobs expired`);
  return { checked: jobsToCheck.length, expired, errors };
}
