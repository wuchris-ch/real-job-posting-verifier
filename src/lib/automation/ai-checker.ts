/**
 * AI-Powered Job Legitimacy Checker
 *
 * Uses OpenAI or Anthropic API to analyze job postings for legitimacy.
 * Falls back to rule-based checking if no API key is configured.
 */

import type { ScrapedJob } from "./scraper";

export interface AIAnalysisResult {
  legitimacyScore: number; // 0-100
  isLikelyGhostJob: boolean;
  concerns: string[];
  positiveSignals: string[];
  recommendation: "APPROVE" | "REVIEW" | "REJECT";
  reasoning: string;
}

const ANALYSIS_PROMPT = `You are an expert at identifying ghost jobs (fake or inactive job postings). Analyze this job listing and provide a legitimacy assessment.

Ghost job indicators to look for:
- Vague job descriptions with no specific responsibilities
- Unrealistic salary ranges for the role level
- Generic company descriptions
- "Urgently hiring" or pressure language
- Requests for personal/financial information
- Too-good-to-be-true benefits
- No clear reporting structure or team mentioned
- Buzzword-heavy with no substance
- Posted for months without updates

Legitimate job indicators:
- Specific technical requirements
- Clear team/department mentioned
- Realistic salary range for the market
- Company details verifiable
- Clear application process
- Posted on company's official ATS

Job Listing:
Title: {{title}}
Company: {{company}}
Location: {{location}}
Salary: {{salary}}
Description: {{description}}

Respond in JSON format:
{
  "legitimacyScore": <0-100>,
  "isLikelyGhostJob": <true/false>,
  "concerns": ["concern1", "concern2"],
  "positiveSignals": ["signal1", "signal2"],
  "recommendation": "APPROVE" | "REVIEW" | "REJECT",
  "reasoning": "Brief explanation"
}`;

/**
 * Call OpenAI API for analysis
 */
async function analyzeWithOpenAI(job: ScrapedJob): Promise<AIAnalysisResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prompt = ANALYSIS_PROMPT
    .replace("{{title}}", job.title)
    .replace("{{company}}", job.company)
    .replace("{{location}}", job.location)
    .replace(
      "{{salary}}",
      job.salaryMin
        ? `$${job.salaryMin.toLocaleString()} - $${(job.salaryMax || job.salaryMin).toLocaleString()}`
        : "Not specified"
    )
    .replace("{{description}}", (job.description || "").slice(0, 2000));

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) return null;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as AIAnalysisResult;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return null;
  }
}

/**
 * Call Anthropic API for analysis
 */
async function analyzeWithAnthropic(job: ScrapedJob): Promise<AIAnalysisResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const prompt = ANALYSIS_PROMPT
    .replace("{{title}}", job.title)
    .replace("{{company}}", job.company)
    .replace("{{location}}", job.location)
    .replace(
      "{{salary}}",
      job.salaryMin
        ? `$${job.salaryMin.toLocaleString()} - $${(job.salaryMax || job.salaryMin).toLocaleString()}`
        : "Not specified"
    )
    .replace("{{description}}", (job.description || "").slice(0, 2000));

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) return null;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as AIAnalysisResult;
  } catch (error) {
    console.error("Error calling Anthropic:", error);
    return null;
  }
}

/**
 * Rule-based fallback when no AI API is available
 */
function analyzeWithRules(job: ScrapedJob): AIAnalysisResult {
  const concerns: string[] = [];
  const positiveSignals: string[] = [];
  let score = 70; // Start with neutral score

  const text = `${job.title} ${job.description || ""}`.toLowerCase();

  // Check for red flags
  if (text.includes("urgently") || text.includes("immediate")) {
    concerns.push("Urgency language detected");
    score -= 15;
  }

  if (text.includes("no experience") && text.includes("senior")) {
    concerns.push("Contradictory experience requirements");
    score -= 20;
  }

  if (job.company.length < 3 || job.company.toLowerCase() === "confidential") {
    concerns.push("Company name not disclosed");
    score -= 15;
  }

  if (!job.description || job.description.length < 100) {
    concerns.push("Very short or missing description");
    score -= 10;
  }

  if (text.includes("guaranteed") || text.includes("unlimited earning")) {
    concerns.push("Too-good-to-be-true claims");
    score -= 25;
  }

  // Check for positive signals
  if (job.salaryMin && job.salaryMax && job.salaryMax > job.salaryMin) {
    positiveSignals.push("Salary range provided");
    score += 10;
  }

  if (
    text.includes("team") ||
    text.includes("report to") ||
    text.includes("manager")
  ) {
    positiveSignals.push("Team structure mentioned");
    score += 5;
  }

  if (
    job.applyUrl.includes("greenhouse") ||
    job.applyUrl.includes("lever") ||
    job.applyUrl.includes("workday")
  ) {
    positiveSignals.push("Uses legitimate ATS platform");
    score += 10;
  }

  if (job.description && job.description.length > 500) {
    positiveSignals.push("Detailed job description");
    score += 5;
  }

  // Cap score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  const isLikelyGhostJob = score < 50;
  const recommendation: AIAnalysisResult["recommendation"] =
    score >= 70 ? "APPROVE" : score >= 50 ? "REVIEW" : "REJECT";

  return {
    legitimacyScore: score,
    isLikelyGhostJob,
    concerns,
    positiveSignals,
    recommendation,
    reasoning: `Rule-based analysis score: ${score}/100. ${concerns.length} concerns, ${positiveSignals.length} positive signals.`,
  };
}

/**
 * Analyze job with AI (tries OpenAI, then Anthropic, then falls back to rules)
 */
export async function analyzeJobWithAI(
  job: ScrapedJob
): Promise<AIAnalysisResult> {
  // Try OpenAI first
  let result = await analyzeWithOpenAI(job);
  if (result) {
    console.log(`AI analysis (OpenAI): ${job.title} - ${result.recommendation}`);
    return result;
  }

  // Try Anthropic
  result = await analyzeWithAnthropic(job);
  if (result) {
    console.log(`AI analysis (Anthropic): ${job.title} - ${result.recommendation}`);
    return result;
  }

  // Fall back to rule-based
  console.log(`Rule-based analysis: ${job.title}`);
  return analyzeWithRules(job);
}

/**
 * Batch analyze jobs
 */
export async function analyzeJobs(
  jobs: ScrapedJob[],
  concurrency: number = 2
): Promise<Map<ScrapedJob, AIAnalysisResult>> {
  const results = new Map<ScrapedJob, AIAnalysisResult>();

  // Process in batches to respect rate limits
  for (let i = 0; i < jobs.length; i += concurrency) {
    const batch = jobs.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((job) => analyzeJobWithAI(job))
    );

    batch.forEach((job, index) => {
      results.set(job, batchResults[index]);
    });

    // Delay between batches for rate limiting
    if (i + concurrency < jobs.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}
