import { createClient } from "@/lib/supabase/server";
import { JobCard } from "@/components/JobCard";
import Link from "next/link";
import type { Job } from "@/types/database";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  // Get 10 most recent verified jobs for preview
  const fortyEightHoursAgo = new Date(
    Date.now() - 48 * 60 * 60 * 1000
  ).toISOString();

  const { data: jobsData } = await supabase
    .from("jobs")
    .select("*")
    .eq("verification_status", "VERIFIED")
    .gte("last_verified_at", fortyEightHoursAgo)
    .order("last_verified_at", { ascending: false })
    .limit(10);

  const jobs = (jobsData as Job[]) || [];

  // Get total count
  const { count } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("verification_status", "VERIFIED")
    .gte("last_verified_at", fortyEightHoursAgo);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-bold text-xl text-gray-900">
            Ghost Job Hunter
          </span>
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-white border-b border-gray-200 py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Stop Applying to Ghost Jobs
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Job boards are flooded with fake listings. We verify every job is
              real, the link works, and the company is actually hiring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/jobs"
                className="inline-block bg-green-600 text-white font-medium px-8 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                View {count ?? 0} Verified Jobs
              </Link>
              <Link
                href="/login"
                className="inline-block bg-white text-gray-700 font-medium px-8 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Get Full Access - $1
              </Link>
            </div>
          </div>
        </section>

        {/* Value Props */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-10 h-10 mb-3 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Auto Verified
                </h3>
                <p className="text-gray-600 text-sm">
                  Every listing automatically checked. We verify the apply link
                  works and scan for red flags.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-10 h-10 mb-3 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Fresh Within 48h
                </h3>
                <p className="text-gray-600 text-sm">
                  Jobs expire if not re-verified. No stale listings from months
                  ago clogging your search.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="w-10 h-10 mb-3 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Just $1
                </h3>
                <p className="text-gray-600 text-sm">
                  One-time payment for full access. No subscriptions, no hidden
                  fees. Save hours of wasted applications.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Preview Jobs */}
        <section className="py-12 bg-white border-t border-gray-200">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Latest Verified Jobs (Free Preview)
            </h2>
            <p className="text-gray-600 mb-6">
              Remote positions verified in the last 48 hours
            </p>

            {jobs && jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.slice(0, 5).map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                No verified jobs available right now. Check back soon!
              </div>
            )}

            {jobs && jobs.length > 5 && (
              <div className="mt-8 text-center">
                <Link
                  href="/jobs"
                  className="inline-block bg-gray-900 text-white font-medium px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  View All {count} Jobs &rarr;
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-green-600">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to find a real job?
            </h2>
            <p className="text-green-100 mb-8">
              Unlock all {count ?? 0}+ verified listings for just $1. One-time
              payment, no subscription.
            </p>
            <Link
              href="/login"
              className="inline-block bg-white text-green-700 font-bold px-8 py-3 rounded-lg hover:bg-green-50 transition-colors"
            >
              Get Full Access - $1
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-3xl mx-auto px-4 text-center text-sm">
          <p>Ghost Job Hunter - Fighting fake job listings since 2024</p>
        </div>
      </footer>
    </div>
  );
}
