"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import type { Job } from "@/types/database";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    const res = await adminFetch("/api/admin/jobs");
    if (res.ok) {
      const data = await res.json();
      setJobs(data);
    }
    setLoading(false);
  }

  const filteredJobs =
    filter === "ALL"
      ? jobs
      : jobs.filter((job) => job.verification_status === filter);

  async function updateStatus(
    jobId: string,
    status: string,
    verify: boolean = false
  ) {
    const body: Record<string, unknown> = { verification_status: status };
    if (verify) {
      body.last_verified_at = new Date().toISOString();
    }

    const res = await adminFetch(`/api/admin/jobs/${jobId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    if (res.ok) {
      fetchJobs();
    }
  }

  async function deleteJob(jobId: string) {
    if (!confirm("Are you sure you want to delete this job?")) return;

    const res = await adminFetch(`/api/admin/jobs/${jobId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchJobs();
    }
  }

  const statusColors: Record<string, string> = {
    VERIFIED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    EXPIRED: "bg-gray-100 text-gray-700",
    BROKEN_LINK: "bg-red-100 text-red-700",
    NOT_HIRING: "bg-orange-100 text-orange-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <Link
          href="/admin/jobs/new"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          + Add Job
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {["ALL", "VERIFIED", "PENDING", "EXPIRED", "BROKEN_LINK", "NOT_HIRING"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === status
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          )
        )}
      </div>

      {/* Jobs Table */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : filteredJobs.length === 0 ? (
        <p className="text-gray-500">No jobs found.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Job
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  Verified
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-500">
                        {job.company} - {job.location}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        statusColors[job.verification_status]
                      }`}
                    >
                      {job.verification_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {job.last_verified_at
                      ? formatDistanceToNow(new Date(job.last_verified_at))
                      : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateStatus(job.id, "VERIFIED", true)}
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        title="Mark as verified"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => updateStatus(job.id, "BROKEN_LINK")}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        title="Mark link as broken"
                      >
                        Broken
                      </button>
                      <Link
                        href={`/admin/jobs/${job.id}`}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
