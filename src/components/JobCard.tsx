import { Job } from "@/types/database";
import { VerificationBadge } from "./VerificationBadge";
import { formatSalary } from "@/lib/utils";

interface JobCardProps {
  job: Job;
  isBlurred?: boolean;
}

export function JobCard({ job, isBlurred = false }: JobCardProps) {
  const locationTypeColors = {
    REMOTE: "bg-blue-100 text-blue-700",
    HYBRID: "bg-purple-100 text-purple-700",
    ONSITE: "bg-orange-100 text-orange-700",
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
        isBlurred ? "blur-sm select-none pointer-events-none" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
          <p className="text-gray-600 text-sm">{job.company}</p>
        </div>
        <VerificationBadge lastVerifiedAt={job.last_verified_at} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            locationTypeColors[job.location_type]
          }`}
        >
          {job.location_type}
        </span>
        <span className="text-gray-500">{job.location}</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">
          {formatSalary(job.salary_min, job.salary_max)}
        </span>
        {!isBlurred && (
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Apply &rarr;
          </a>
        )}
      </div>
    </div>
  );
}
