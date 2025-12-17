"use client";

import { useState, useCallback } from "react";
import { Job } from "@/types/database";
import { JobCard } from "./JobCard";
import { JobFilters } from "./JobFilters";
import { PaymentButton } from "./PaymentButton";

interface JobListProps {
  jobs: Job[];
  hasPaid: boolean;
  isAuthenticated?: boolean;
  freeLimit?: number;
}

export function JobList({
  jobs,
  hasPaid,
  isAuthenticated = false,
  freeLimit = 10,
}: JobListProps) {
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(jobs);

  const handleFilteredJobsChange = useCallback((filtered: Job[]) => {
    setFilteredJobs(filtered);
  }, []);

  // Show paywall if user hasn't paid and there are more than freeLimit jobs total
  const shouldShowPaywall = !hasPaid && jobs.length > freeLimit;

  // If not paid, only show up to freeLimit jobs from filtered results
  const visibleJobs = hasPaid ? filteredJobs : filteredJobs.slice(0, freeLimit);
  const hiddenCount = hasPaid ? 0 : Math.max(0, filteredJobs.length - freeLimit);

  return (
    <div>
      <JobFilters jobs={jobs} onFilteredJobsChange={handleFilteredJobsChange} />

      <p className="text-sm text-gray-500 mb-4">
        Showing {visibleJobs.length} of {filteredJobs.length} jobs
        {filteredJobs.length !== jobs.length && ` (${jobs.length} total)`}
      </p>

      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
            No jobs match your filters. Try adjusting your criteria.
          </div>
        ) : (
          <>
            {visibleJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}

            {shouldShowPaywall && (
              <>
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-gray-50 px-4 text-sm text-gray-500">
                      {hiddenCount > 0
                        ? `${hiddenCount} more matching jobs`
                        : `${jobs.length - freeLimit}+ more jobs available`}
                    </span>
                  </div>
                </div>

                {filteredJobs.slice(freeLimit, freeLimit + 3).map((job) => (
                  <JobCard key={job.id} job={job} isBlurred />
                ))}

                <div className="text-center py-8 bg-gradient-to-t from-white via-white to-transparent -mt-32 pt-40 relative z-10">
                  <p className="text-gray-600 mb-4">
                    Unlock all {jobs.length} verified jobs for just $1
                  </p>
                  {isAuthenticated ? (
                    <PaymentButton />
                  ) : (
                    <a
                      href="/login"
                      className="inline-block bg-green-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Sign in to Get Full Access - $1
                    </a>
                  )}
                </div>
              </>
            )}

            {/* Paid users already see all jobs via visibleJobs above */}
          </>
        )}
      </div>
    </div>
  );
}
