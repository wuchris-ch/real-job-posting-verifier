import { createClient } from "@/lib/supabase/server";
import { JobList } from "@/components/JobList";
import Link from "next/link";

export const revalidate = 60; // Revalidate every minute

export default async function JobsPage() {
  const supabase = await createClient();

  // Get current user and their payment status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasPaid = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("has_paid")
      .eq("id", user.id)
      .single();
    const profileData = profile as { has_paid: boolean } | null;
    hasPaid = profileData?.has_paid ?? false;
  }

  // Get jobs verified within the last 48 hours
  const fortyEightHoursAgo = new Date(
    Date.now() - 48 * 60 * 60 * 1000
  ).toISOString();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("verification_status", "VERIFIED")
    .gte("last_verified_at", fortyEightHoursAgo)
    .order("last_verified_at", { ascending: false })
    .limit(10000);

  if (error) {
    console.error("Error fetching jobs:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-gray-900">
            Ghost Job Hunter
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <span className="text-sm text-gray-600">{user.email}</span>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verified Remote Jobs
          </h1>
          <p className="text-gray-600">
            {jobs?.length ?? 0} jobs verified in the last 48 hours
          </p>
        </div>

        {jobs && jobs.length > 0 ? (
          <JobList jobs={jobs} hasPaid={hasPaid} isAuthenticated={!!user} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            No verified jobs available right now. Check back soon!
          </div>
        )}
      </main>
    </div>
  );
}
