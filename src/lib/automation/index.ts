/**
 * Job Automation Module
 *
 * Provides automated job scraping, verification, and database management.
 *
 * Components:
 * - scraper.ts: Fetches jobs from Remote OK, Remotive, Arbeitnow APIs
 * - verifier.ts: Validates URLs and checks for red flags
 * - ai-checker.ts: Uses AI to analyze job legitimacy
 * - pipeline.ts: Orchestrates the full automation workflow
 *
 * Usage:
 * - Cron endpoints: /api/cron/scrape, /api/cron/verify
 * - Manual triggers: Admin UI at /admin/automation
 *
 * Environment Variables:
 * - OPENAI_API_KEY: For GPT-4 analysis (optional)
 * - ANTHROPIC_API_KEY: For Claude analysis (optional)
 * - CRON_SECRET: For Vercel cron authentication
 */

export { scrapeAllSources, scrapeRemoteOK, scrapeRemotive, scrapeArbeitnow } from "./scraper";
export type { ScrapedJob } from "./scraper";

export { verifyJob, verifyJobs } from "./verifier";
export type { VerificationResult } from "./verifier";

export { analyzeJobWithAI, analyzeJobs } from "./ai-checker";
export type { AIAnalysisResult } from "./ai-checker";

export { runPipeline, reverifyExistingJobs } from "./pipeline";
export type { PipelineResult } from "./pipeline";
