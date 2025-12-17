"use client";

import { useState, useMemo, useEffect } from "react";
import { Job } from "@/types/database";

interface JobFiltersProps {
  jobs: Job[];
  onFilteredJobsChange: (jobs: Job[]) => void;
}

export function JobFilters({ jobs, onFilteredJobsChange }: JobFiltersProps) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");
  const [salaryMin, setSalaryMin] = useState("");
  const [locationType, setLocationType] = useState("all");
  const [source, setSource] = useState("all");

  // Extract unique values for dropdowns
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    jobs.forEach((job) => {
      if (job.source) {
        // Group greenhouse-* and lever-* sources
        if (job.source.startsWith("greenhouse-")) {
          sources.add("greenhouse");
        } else if (job.source.startsWith("lever-")) {
          sources.add("lever");
        } else {
          sources.add(job.source);
        }
      }
    });
    return Array.from(sources).sort();
  }, [jobs]);

  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();
    jobs.forEach((job) => {
      if (job.location) {
        // Simplify locations
        const loc = job.location.toLowerCase();
        if (loc.includes("remote") || loc === "worldwide" || loc === "anywhere") {
          locations.add("Remote");
        } else if (loc.includes("usa") || loc.includes("united states") || loc.includes("us only")) {
          locations.add("USA");
        } else if (loc.includes("europe") || loc.includes("eu")) {
          locations.add("Europe");
        } else {
          locations.add("Other");
        }
      }
    });
    return Array.from(locations).sort();
  }, [jobs]);

  // Compute filtered jobs
  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    // Search filter (title, company)
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower)
      );
    }

    // Location filter
    if (location !== "all") {
      filtered = filtered.filter((job) => {
        const loc = job.location.toLowerCase();
        if (location === "Remote") {
          return loc.includes("remote") || loc === "worldwide" || loc === "anywhere";
        } else if (location === "USA") {
          return loc.includes("usa") || loc.includes("united states") || loc.includes("us only");
        } else if (location === "Europe") {
          return loc.includes("europe") || loc.includes("eu");
        }
        return true;
      });
    }

    // Location type filter (REMOTE, HYBRID, ONSITE)
    if (locationType !== "all") {
      filtered = filtered.filter((job) => job.location_type === locationType);
    }

    // Salary filter
    if (salaryMin) {
      const minSalary = parseInt(salaryMin, 10);
      filtered = filtered.filter(
        (job) => job.salary_min && job.salary_min >= minSalary
      );
    }

    // Source filter
    if (source !== "all") {
      filtered = filtered.filter((job) => {
        if (!job.source) return false;
        if (source === "greenhouse") {
          return job.source.startsWith("greenhouse-");
        } else if (source === "lever") {
          return job.source.startsWith("lever-");
        }
        return job.source === source;
      });
    }

    return filtered;
  }, [jobs, search, location, locationType, salaryMin, source]);

  // Notify parent when filtered jobs change
  useEffect(() => {
    onFilteredJobsChange(filteredJobs);
  }, [filteredJobs, onFilteredJobsChange]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div className="sm:col-span-2 lg:col-span-3">
          <input
            type="text"
            placeholder="Search job title or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Locations</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Location Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Work Type
          </label>
          <select
            value={locationType}
            onChange={(e) => setLocationType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Types</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
          </select>
        </div>

        {/* Salary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Salary
          </label>
          <select
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Any Salary</option>
            <option value="50000">$50k+</option>
            <option value="75000">$75k+</option>
            <option value="100000">$100k+</option>
            <option value="150000">$150k+</option>
            <option value="200000">$200k+</option>
          </select>
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Sources</option>
            {uniqueSources.map((src) => (
              <option key={src} value={src}>
                {src.charAt(0).toUpperCase() + src.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
