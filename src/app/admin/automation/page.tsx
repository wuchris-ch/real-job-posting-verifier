"use client";

import { useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";

interface PipelineResult {
  scrapedCount: number;
  verifiedCount: number;
  addedCount: number;
  skippedCount: number;
  failedCount: number;
  duration: number;
  errors: string[];
}

interface VerifyResult {
  checked: number;
  expired: number;
  errors: string[];
}

export default function AutomationPage() {
  const [scrapeStatus, setScrapeStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [scrapeResult, setScrapeResult] = useState<PipelineResult | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState("");

  const runScrape = async () => {
    setScrapeStatus("running");
    setError("");
    setScrapeResult(null);

    try {
      const response = await adminFetch("/api/cron/scrape", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setScrapeStatus("success");
        setScrapeResult(data.result);
      } else {
        setScrapeStatus("error");
        setError(data.error || "Scrape failed");
      }
    } catch (err) {
      setScrapeStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const runVerify = async () => {
    setVerifyStatus("running");
    setError("");
    setVerifyResult(null);

    try {
      const response = await adminFetch("/api/cron/verify", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setVerifyStatus("success");
        setVerifyResult(data.result);
      } else {
        setVerifyStatus("error");
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      setVerifyStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-bold text-xl text-gray-900">
              Admin
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">Automation</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Job Automation
        </h1>
        <p className="text-gray-600 mb-8">
          Automatically scrape and verify jobs from multiple sources.
        </p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Scrape Jobs Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Scrape New Jobs
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Fetches jobs from Remote OK, Remotive, and Arbeitnow APIs. Filters
              for entry-level tech positions and verifies URLs.
            </p>

            <div className="mb-4 text-sm text-gray-500">
              <div>Schedule: Every 6 hours</div>
              <div>Sources: 3 job APIs</div>
            </div>

            <button
              onClick={runScrape}
              disabled={scrapeStatus === "running"}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                scrapeStatus === "running"
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {scrapeStatus === "running" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Running Pipeline...
                </span>
              ) : (
                "Run Scrape Now"
              )}
            </button>

            {scrapeResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">Scraped:</span>{" "}
                    <span className="font-medium">
                      {scrapeResult.scrapedCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Verified:</span>{" "}
                    <span className="font-medium">
                      {scrapeResult.verifiedCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Added:</span>{" "}
                    <span className="font-medium text-green-600">
                      {scrapeResult.addedCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Skipped:</span>{" "}
                    <span className="font-medium">
                      {scrapeResult.skippedCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Failed:</span>{" "}
                    <span className="font-medium text-red-600">
                      {scrapeResult.failedCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>{" "}
                    <span className="font-medium">
                      {(scrapeResult.duration / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>
                {scrapeResult.errors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-red-600 font-medium mb-1">Errors:</div>
                    <ul className="text-red-600 text-xs list-disc pl-4">
                      {scrapeResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Re-verify Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Re-verify Existing Jobs
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Checks if existing verified jobs still have working apply links.
              Marks broken links as expired.
            </p>

            <div className="mb-4 text-sm text-gray-500">
              <div>Schedule: Every 12 hours</div>
              <div>Checks jobs verified 24h+ ago</div>
            </div>

            <button
              onClick={runVerify}
              disabled={verifyStatus === "running"}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                verifyStatus === "running"
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {verifyStatus === "running" ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Verifying...
                </span>
              ) : (
                "Run Verification Now"
              )}
            </button>

            {verifyResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">Checked:</span>{" "}
                    <span className="font-medium">{verifyResult.checked}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Expired:</span>{" "}
                    <span className="font-medium text-red-600">
                      {verifyResult.expired}
                    </span>
                  </div>
                </div>
                {verifyResult.errors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-red-600 font-medium mb-1">Errors:</div>
                    <ul className="text-red-600 text-xs list-disc pl-4">
                      {verifyResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            How Automation Works
          </h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal pl-4">
            <li>
              <strong>Scrape:</strong> Fetches jobs from Remote OK, Remotive,
              and Arbeitnow APIs
            </li>
            <li>
              <strong>Filter:</strong> Keeps only entry-level tech positions
              (junior, associate, etc.)
            </li>
            <li>
              <strong>Verify URLs:</strong> Checks that apply links return HTTP
              200
            </li>
            <li>
              <strong>AI Analysis:</strong> Uses OpenAI/Anthropic to score
              legitimacy (or falls back to rules)
            </li>
            <li>
              <strong>Store:</strong> Approved jobs are added to database as
              VERIFIED
            </li>
          </ol>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <h4 className="font-medium text-blue-900 mb-1">
              Environment Variables
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                <code className="bg-blue-100 px-1 rounded">OPENAI_API_KEY</code>{" "}
                - For GPT-4 analysis (optional)
              </li>
              <li>
                <code className="bg-blue-100 px-1 rounded">
                  ANTHROPIC_API_KEY
                </code>{" "}
                - For Claude analysis (optional)
              </li>
              <li>
                <code className="bg-blue-100 px-1 rounded">CRON_SECRET</code> -
                Secret for Vercel cron auth
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
