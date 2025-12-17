/**
 * Job Verifier - Validates job listings are real and active
 *
 * Verification steps:
 * 1. Check if apply URL returns 200
 * 2. Check if company domain exists
 * 3. Detect common ghost job patterns
 */

import type { ScrapedJob } from "./scraper";

export interface VerificationResult {
  isValid: boolean;
  urlStatus: number | null;
  urlAccessible: boolean;
  companyDomainValid: boolean;
  hasRedFlags: boolean;
  redFlags: string[];
  notes: string;
}

// Red flag patterns that indicate ghost/fake jobs
const RED_FLAG_PATTERNS = [
  { pattern: /urgently hiring/i, flag: "Urgently hiring language" },
  { pattern: /immediate start/i, flag: "Immediate start pressure" },
  { pattern: /no experience needed/i, flag: "No experience needed for tech role" },
  { pattern: /work from home \$\d+k/i, flag: "Work from home with unrealistic salary claims" },
  { pattern: /\$\d{3,}\/day/i, flag: "Unrealistic daily rate" },
  { pattern: /\$\d{3,}\/hour/i, flag: "Unrealistic hourly rate (>$200/hr for entry level)" },
  { pattern: /guaranteed income/i, flag: "Guaranteed income claims" },
  { pattern: /be your own boss/i, flag: "MLM-style language" },
  { pattern: /unlimited earning/i, flag: "Unlimited earning claims" },
  { pattern: /crypto.*payment/i, flag: "Crypto payment offers" },
  { pattern: /training fee|pay for training/i, flag: "Requires training fee" },
  { pattern: /send.*money|wire transfer/i, flag: "Requests money transfer" },
  { pattern: /personal.*bank.*account/i, flag: "Requests bank account info" },
  { pattern: /ssn|social security/i, flag: "Requests SSN upfront" },
];

// Legitimate job boards/company domains
const TRUSTED_DOMAINS = [
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "workday.com",
  "smartrecruiters.com",
  "jobvite.com",
  "icims.com",
  "taleo.net",
  "myworkdayjobs.com",
  "careers-page.com",
  "breezy.hr",
  "recruitee.com",
  "bamboohr.com",
  "workable.com",
  "jazz.co",
  "applytojob.com",
];

/**
 * Check if a URL is accessible
 */
async function checkUrlAccessibility(
  url: string
): Promise<{ accessible: boolean; status: number | null }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    clearTimeout(timeoutId);

    // Accept 2xx and 3xx status codes
    const accessible = response.status >= 200 && response.status < 400;
    return { accessible, status: response.status };
  } catch (error) {
    // Try GET if HEAD fails (some servers don't support HEAD)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      clearTimeout(timeoutId);

      const accessible = response.status >= 200 && response.status < 400;
      return { accessible, status: response.status };
    } catch {
      return { accessible: false, status: null };
    }
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

/**
 * Check if company domain is valid
 */
async function checkCompanyDomain(applyUrl: string): Promise<boolean> {
  const domain = extractDomain(applyUrl);
  if (!domain) return false;

  // Trust known ATS/job board domains
  if (TRUSTED_DOMAINS.some((trusted) => domain.includes(trusted))) {
    return true;
  }

  // For company domains, check if the root domain is accessible
  try {
    const rootUrl = `https://${domain.replace(/^www\./, "")}`;
    const { accessible } = await checkUrlAccessibility(rootUrl);
    return accessible;
  } catch {
    return false;
  }
}

/**
 * Detect red flags in job listing
 */
function detectRedFlags(job: ScrapedJob): string[] {
  const redFlags: string[] = [];
  const textToCheck = `${job.title} ${job.description || ""}`;

  for (const { pattern, flag } of RED_FLAG_PATTERNS) {
    if (pattern.test(textToCheck)) {
      redFlags.push(flag);
    }
  }

  // Check for unrealistic salary for entry level
  if (job.salaryMin && job.salaryMin > 200000) {
    redFlags.push("Unrealistic entry-level salary (>$200k)");
  }

  // Check for vague company names
  if (
    job.company.length < 3 ||
    job.company.toLowerCase() === "company" ||
    job.company.toLowerCase() === "confidential"
  ) {
    redFlags.push("Vague or confidential company name");
  }

  return redFlags;
}

/**
 * Verify a single job listing
 */
export async function verifyJob(job: ScrapedJob): Promise<VerificationResult> {
  console.log(`Verifying: ${job.title} at ${job.company}`);

  // Check URL accessibility
  const { accessible: urlAccessible, status: urlStatus } =
    await checkUrlAccessibility(job.applyUrl);

  // Check company domain
  const companyDomainValid = await checkCompanyDomain(job.applyUrl);

  // Detect red flags
  const redFlags = detectRedFlags(job);
  const hasRedFlags = redFlags.length > 0;

  // Determine overall validity
  const isValid = urlAccessible && companyDomainValid && !hasRedFlags;

  // Build notes
  const notes = [
    urlAccessible
      ? `URL accessible (${urlStatus})`
      : `URL not accessible (${urlStatus || "failed"})`,
    companyDomainValid ? "Company domain valid" : "Company domain invalid",
    hasRedFlags ? `Red flags: ${redFlags.join(", ")}` : "No red flags",
  ].join("; ");

  return {
    isValid,
    urlStatus,
    urlAccessible,
    companyDomainValid,
    hasRedFlags,
    redFlags,
    notes,
  };
}

/**
 * Batch verify jobs with rate limiting
 */
export async function verifyJobs(
  jobs: ScrapedJob[],
  concurrency: number = 3
): Promise<Map<ScrapedJob, VerificationResult>> {
  const results = new Map<ScrapedJob, VerificationResult>();

  // Process in batches to avoid rate limiting
  for (let i = 0; i < jobs.length; i += concurrency) {
    const batch = jobs.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((job) => verifyJob(job)));

    batch.forEach((job, index) => {
      results.set(job, batchResults[index]);
    });

    // Small delay between batches
    if (i + concurrency < jobs.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
