/**
 * Job Scraper - Fetches jobs from free public APIs
 *
 * Sources:
 * - Remote OK (https://remoteok.com/api)
 * - Remotive (https://remotive.com/api/remote-jobs)
 * - Arbeitnow (https://www.arbeitnow.com/api/job-board-api)
 * - Himalayas (https://himalayas.app/jobs/api)
 * - Jobicy (https://jobicy.com/api/v2/remote-jobs)
 * - We Work Remotely (https://weworkremotely.com/api)
 */

export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  locationType: "REMOTE" | "HYBRID" | "ONSITE";
  salaryMin?: number;
  salaryMax?: number;
  applyUrl: string;
  sourceUrl: string;
  source: string;
  description?: string;
}

function parseSalary(
  salaryStr?: string | number
): { min?: number; max?: number } {
  if (!salaryStr) return {};

  if (typeof salaryStr === "number") {
    return { min: salaryStr, max: salaryStr };
  }

  // Extract numbers from salary string
  const numbers = salaryStr.match(/\d+/g);
  if (!numbers) return {};

  const parsed = numbers.map((n) => parseInt(n, 10));

  // Handle "100k" format
  if (salaryStr.toLowerCase().includes("k")) {
    return {
      min: parsed[0] ? parsed[0] * 1000 : undefined,
      max: parsed[1] ? parsed[1] * 1000 : parsed[0] ? parsed[0] * 1000 : undefined,
    };
  }

  return {
    min: parsed[0],
    max: parsed[1] || parsed[0],
  };
}

/**
 * Fetch jobs from Remote OK API
 * API docs: https://remoteok.com/api
 */
export async function scrapeRemoteOK(): Promise<ScrapedJob[]> {
  try {
    const response = await fetch("https://remoteok.com/api", {
      headers: {
        "User-Agent": "GhostJobHunter/1.0",
      },
    });

    if (!response.ok) {
      console.error("Remote OK API error:", response.status);
      return [];
    }

    const data = await response.json();

    // First element is metadata, skip it
    const jobs = Array.isArray(data) ? data.slice(1) : [];

    return jobs
      .map((job: Record<string, unknown>) => {
        const salary = parseSalary(
          job.salary_min as string | number | undefined
        );
        return {
          title: String(job.position || ""),
          company: String(job.company || ""),
          location: String(job.location || "Remote"),
          locationType: "REMOTE" as const,
          salaryMin: salary.min,
          salaryMax:
            parseSalary(job.salary_max as string | number | undefined).max ||
            salary.max,
          applyUrl: String(job.apply_url || job.url || ""),
          sourceUrl: String(job.url || ""),
          source: "remoteok",
          description: String(job.description || ""),
        };
      })
      .filter((job: ScrapedJob) => job.applyUrl && job.title && job.company);
  } catch (error) {
    console.error("Error scraping Remote OK:", error);
    return [];
  }
}

/**
 * Fetch jobs from Remotive API
 * API docs: https://remotive.com/api/remote-jobs
 */
export async function scrapeRemotive(): Promise<ScrapedJob[]> {
  try {
    // Get all jobs (no category filter)
    const response = await fetch(
      "https://remotive.com/api/remote-jobs?limit=200",
      {
        headers: {
          "User-Agent": "GhostJobHunter/1.0",
        },
      }
    );

    if (!response.ok) {
      console.error("Remotive API error:", response.status);
      return [];
    }

    const data = await response.json();
    const jobs = data.jobs || [];

    return jobs
      .map((job: Record<string, unknown>) => {
        const salary = parseSalary(job.salary as string | undefined);
        return {
          title: String(job.title || ""),
          company: String(job.company_name || ""),
          location: String(
            job.candidate_required_location || job.job_type || "Remote"
          ),
          locationType: "REMOTE" as const,
          salaryMin: salary.min,
          salaryMax: salary.max,
          applyUrl: String(job.url || ""),
          sourceUrl: String(job.url || ""),
          source: "remotive",
          description: String(job.description || ""),
        };
      })
      .filter((job: ScrapedJob) => job.applyUrl && job.title && job.company);
  } catch (error) {
    console.error("Error scraping Remotive:", error);
    return [];
  }
}

/**
 * Fetch jobs from Arbeitnow API
 * API docs: https://www.arbeitnow.com/api/job-board-api
 */
export async function scrapeArbeitnow(): Promise<ScrapedJob[]> {
  try {
    const response = await fetch(
      "https://www.arbeitnow.com/api/job-board-api",
      {
        headers: {
          "User-Agent": "GhostJobHunter/1.0",
        },
      }
    );

    if (!response.ok) {
      console.error("Arbeitnow API error:", response.status);
      return [];
    }

    const data = await response.json();
    const jobs = data.data || [];

    return jobs
      .map((job: Record<string, unknown>) => ({
        title: String(job.title || ""),
        company: String(job.company_name || ""),
        location: String(job.location || ""),
        locationType: job.remote ? ("REMOTE" as const) : ("ONSITE" as const),
        salaryMin: undefined,
        salaryMax: undefined,
        applyUrl: String(job.url || ""),
        sourceUrl: String(job.url || ""),
        source: "arbeitnow",
        description: String(job.description || ""),
      }))
      .filter((job: ScrapedJob) => job.applyUrl && job.title && job.company);
  } catch (error) {
    console.error("Error scraping Arbeitnow:", error);
    return [];
  }
}

/**
 * Fetch jobs from Himalayas API
 * API docs: https://himalayas.app/api
 * Max 20 per request, paginate to get more
 */
export async function scrapeHimalayas(): Promise<ScrapedJob[]> {
  const allJobs: ScrapedJob[] = [];
  const limit = 20;
  const maxPages = 25; // Get up to 500 jobs

  try {
    for (let page = 0; page < maxPages; page++) {
      const offset = page * limit;
      const response = await fetch(
        `https://himalayas.app/jobs/api?limit=${limit}&offset=${offset}`,
        {
          headers: {
            "User-Agent": "GhostJobHunter/1.0",
          },
        }
      );

      if (!response.ok) {
        console.error("Himalayas API error:", response.status);
        break;
      }

      const jobs = await response.json();

      if (!Array.isArray(jobs) || jobs.length === 0) {
        break;
      }

      const mapped = jobs
        .map((job: Record<string, unknown>) => ({
          title: String(job.title || ""),
          company: String(job.companyName || ""),
          location: String(
            (Array.isArray(job.locationRestrictions) &&
              job.locationRestrictions.join(", ")) ||
              "Remote"
          ),
          locationType: "REMOTE" as const,
          salaryMin: job.minSalary as number | undefined,
          salaryMax: job.maxSalary as number | undefined,
          applyUrl: String(job.applicationLink || job.url || ""),
          sourceUrl: String(job.url || ""),
          source: "himalayas",
          description: String(job.description || job.excerpt || ""),
        }))
        .filter((job: ScrapedJob) => job.applyUrl && job.title && job.company);

      allJobs.push(...mapped);

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  } catch (error) {
    console.error("Error scraping Himalayas:", error);
  }

  return allJobs;
}

/**
 * Fetch jobs from Jobicy API
 * API docs: https://jobicy.com/api/v2/remote-jobs
 */
export async function scrapeJobicy(): Promise<ScrapedJob[]> {
  try {
    const response = await fetch(
      "https://jobicy.com/api/v2/remote-jobs?count=100",
      {
        headers: {
          "User-Agent": "GhostJobHunter/1.0",
        },
      }
    );

    if (!response.ok) {
      console.error("Jobicy API error:", response.status);
      return [];
    }

    const data = await response.json();
    const jobs = data.jobs || [];

    return jobs
      .map((job: Record<string, unknown>) => ({
        title: String(job.jobTitle || ""),
        company: String(job.companyName || ""),
        location: String(job.jobGeo || "Remote"),
        locationType: "REMOTE" as const,
        salaryMin: job.annualSalaryMin as number | undefined,
        salaryMax: job.annualSalaryMax as number | undefined,
        applyUrl: String(job.url || ""),
        sourceUrl: String(job.url || ""),
        source: "jobicy",
        description: String(job.jobDescription || job.jobExcerpt || ""),
      }))
      .filter((job: ScrapedJob) => job.applyUrl && job.title && job.company);
  } catch (error) {
    console.error("Error scraping Jobicy:", error);
    return [];
  }
}

/**
 * Fetch jobs from We Work Remotely API
 * API docs: https://weworkremotely.com/api
 */
export async function scrapeWeWorkRemotely(): Promise<ScrapedJob[]> {
  try {
    const response = await fetch(
      "https://weworkremotely.com/api/v1/remote-jobs",
      {
        headers: {
          "User-Agent": "GhostJobHunter/1.0",
        },
      }
    );

    if (!response.ok) {
      console.error("We Work Remotely API error:", response.status);
      return [];
    }

    const jobs = await response.json();

    if (!Array.isArray(jobs)) {
      console.error("We Work Remotely unexpected response format");
      return [];
    }

    return jobs
      .map((job: Record<string, unknown>) => ({
        title: String(job.title || ""),
        company: String(job.company || ""),
        location: String(job.region || "Remote"),
        locationType: "REMOTE" as const,
        salaryMin: undefined,
        salaryMax: undefined,
        applyUrl: String(job.instructions || job.url || ""),
        sourceUrl: String(job.url || `https://weworkremotely.com/remote-jobs/${job.id}`),
        source: "weworkremotely",
        description: String(job.description || ""),
      }))
      .filter((job: ScrapedJob) => job.applyUrl && job.title && job.company);
  } catch (error) {
    console.error("Error scraping We Work Remotely:", error);
    return [];
  }
}

/**
 * List of tech company Greenhouse board tokens
 */
const GREENHOUSE_COMPANIES = [
  "stripe",
  "mongodb",
  "figma",
  "notion",
  "discord",
  "plaid",
  "ramp",
  "brex",
  "gusto",
  "airtable",
  "webflow",
  "vercel",
  "supabase",
  "linear",
  "loom",
  "miro",
  "asana",
  "dropbox",
  "twitch",
  "reddit",
  "coinbase",
  "robinhood",
  "doordash",
  "instacart",
  "lyft",
  "uber",
  "airbnb",
  "snapchat",
  "pinterest",
  "spotify",
  "netflix",
  "databricks",
  "snowflake",
  "datadog",
  "cloudflare",
  "elastic",
  "gitlab",
  "hashicorp",
  "confluent",
  "okta",
];

/**
 * List of tech company Lever board tokens
 */
const LEVER_COMPANIES = [
  "openai",
  "anthropic",
  "scale",
  "anyscale",
  "huggingface",
  "stability",
  "replit",
  "sourcegraph",
  "retool",
  "deel",
  "remote",
  "oysterhr",
  "lattice",
  "rippling",
  "zapier",
  "calendly",
  "canva",
  "grammarly",
  "duolingo",
  "quizlet",
];

/**
 * Fetch jobs from a Greenhouse company board
 */
async function scrapeGreenhouseCompany(
  boardToken: string
): Promise<ScrapedJob[]> {
  try {
    const response = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`,
      {
        headers: {
          "User-Agent": "GhostJobHunter/1.0",
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const jobs = data.jobs || [];

    return jobs
      .map((job: Record<string, unknown>) => ({
        title: String(job.title || ""),
        company: boardToken.charAt(0).toUpperCase() + boardToken.slice(1),
        location: String(
          (job.location as Record<string, unknown>)?.name || "Remote"
        ),
        locationType: String(
          (job.location as Record<string, unknown>)?.name || ""
        )
          .toLowerCase()
          .includes("remote")
          ? ("REMOTE" as const)
          : ("ONSITE" as const),
        salaryMin: undefined,
        salaryMax: undefined,
        applyUrl: String(job.absolute_url || ""),
        sourceUrl: String(job.absolute_url || ""),
        source: `greenhouse-${boardToken}`,
        description: String(job.content || ""),
      }))
      .filter((job: ScrapedJob) => job.applyUrl && job.title);
  } catch {
    return [];
  }
}

/**
 * Fetch jobs from a Lever company board
 */
async function scrapeLeverCompany(boardToken: string): Promise<ScrapedJob[]> {
  try {
    const response = await fetch(
      `https://api.lever.co/v0/postings/${boardToken}?mode=json`,
      {
        headers: {
          "User-Agent": "GhostJobHunter/1.0",
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const jobs = await response.json();

    if (!Array.isArray(jobs)) {
      return [];
    }

    return jobs
      .map((job: Record<string, unknown>) => {
        const categories = job.categories as Record<string, unknown> | undefined;
        return {
          title: String(job.text || ""),
          company: boardToken.charAt(0).toUpperCase() + boardToken.slice(1),
          location: String(categories?.location || "Remote"),
          locationType: String(categories?.location || "")
            .toLowerCase()
            .includes("remote")
            ? ("REMOTE" as const)
            : ("ONSITE" as const),
          salaryMin: undefined,
          salaryMax: undefined,
          applyUrl: String(job.applyUrl || job.hostedUrl || ""),
          sourceUrl: String(job.hostedUrl || ""),
          source: `lever-${boardToken}`,
          description: String(job.descriptionPlain || ""),
        };
      })
      .filter((job: ScrapedJob) => job.applyUrl && job.title);
  } catch {
    return [];
  }
}

/**
 * Fetch jobs from all Greenhouse companies
 */
export async function scrapeGreenhouseAll(): Promise<ScrapedJob[]> {
  console.log(`Scraping ${GREENHOUSE_COMPANIES.length} Greenhouse boards...`);
  const allJobs: ScrapedJob[] = [];

  // Batch requests to avoid overwhelming servers
  const batchSize = 5;
  for (let i = 0; i < GREENHOUSE_COMPANIES.length; i += batchSize) {
    const batch = GREENHOUSE_COMPANIES.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((token) => scrapeGreenhouseCompany(token))
    );
    results.forEach((jobs) => allJobs.push(...jobs));

    // Small delay between batches
    if (i + batchSize < GREENHOUSE_COMPANIES.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return allJobs;
}

/**
 * Fetch jobs from all Lever companies
 */
export async function scrapeLeverAll(): Promise<ScrapedJob[]> {
  console.log(`Scraping ${LEVER_COMPANIES.length} Lever boards...`);
  const allJobs: ScrapedJob[] = [];

  // Batch requests
  const batchSize = 5;
  for (let i = 0; i < LEVER_COMPANIES.length; i += batchSize) {
    const batch = LEVER_COMPANIES.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((token) => scrapeLeverCompany(token))
    );
    results.forEach((jobs) => allJobs.push(...jobs));

    if (i + batchSize < LEVER_COMPANIES.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return allJobs;
}

/**
 * Scrape all sources and deduplicate
 */
export async function scrapeAllSources(): Promise<ScrapedJob[]> {
  console.log("Starting job scrape from all sources...");

  const [
    remoteOKJobs,
    remotiveJobs,
    arbeitnowJobs,
    himalayasJobs,
    jobicyJobs,
    wwrJobs,
    greenhouseJobs,
    leverJobs,
  ] = await Promise.all([
    scrapeRemoteOK(),
    scrapeRemotive(),
    scrapeArbeitnow(),
    scrapeHimalayas(),
    scrapeJobicy(),
    scrapeWeWorkRemotely(),
    scrapeGreenhouseAll(),
    scrapeLeverAll(),
  ]);

  console.log(`Remote OK: ${remoteOKJobs.length} jobs`);
  console.log(`Remotive: ${remotiveJobs.length} jobs`);
  console.log(`Arbeitnow: ${arbeitnowJobs.length} jobs`);
  console.log(`Himalayas: ${himalayasJobs.length} jobs`);
  console.log(`Jobicy: ${jobicyJobs.length} jobs`);
  console.log(`We Work Remotely: ${wwrJobs.length} jobs`);
  console.log(`Greenhouse (${GREENHOUSE_COMPANIES.length} companies): ${greenhouseJobs.length} jobs`);
  console.log(`Lever (${LEVER_COMPANIES.length} companies): ${leverJobs.length} jobs`);

  const allJobs = [
    ...remoteOKJobs,
    ...remotiveJobs,
    ...arbeitnowJobs,
    ...himalayasJobs,
    ...jobicyJobs,
    ...wwrJobs,
    ...greenhouseJobs,
    ...leverJobs,
  ];

  // Deduplicate by company + title combination
  const seen = new Set<string>();
  const uniqueJobs = allJobs.filter((job) => {
    const key = `${job.company.toLowerCase()}-${job.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`Total unique jobs: ${uniqueJobs.length}`);
  return uniqueJobs;
}
