"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";
import type { Job } from "@/types/database";

export default function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [job, setJob] = useState<Job | null>(null);

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    location_type: "REMOTE",
    salary_min: "",
    salary_max: "",
    apply_url: "",
    source_url: "",
    verification_status: "PENDING",
    verification_notes: "",
  });

  useEffect(() => {
    async function fetchJob() {
      const res = await adminFetch(`/api/admin/jobs/${id}`);
      if (res.ok) {
        const data = await res.json();
        setJob(data);
        setForm({
          title: data.title,
          company: data.company,
          location: data.location,
          location_type: data.location_type,
          salary_min: data.salary_min?.toString() || "",
          salary_max: data.salary_max?.toString() || "",
          apply_url: data.apply_url,
          source_url: data.source_url,
          verification_status: data.verification_status,
          verification_notes: data.verification_notes || "",
        });
      } else {
        setError("Job not found");
      }
      setLoading(false);
    }
    fetchJob();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body: Record<string, unknown> = {
      title: form.title,
      company: form.company,
      location: form.location,
      location_type: form.location_type,
      salary_min: form.salary_min ? parseInt(form.salary_min) : null,
      salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      apply_url: form.apply_url,
      source_url: form.source_url,
      verification_status: form.verification_status,
      verification_notes: form.verification_notes || null,
      updated_at: new Date().toISOString(),
    };

    // Update last_verified_at if marking as verified
    if (
      form.verification_status === "VERIFIED" &&
      job?.verification_status !== "VERIFIED"
    ) {
      body.last_verified_at = new Date().toISOString();
    }

    const res = await adminFetch(`/api/admin/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update job");
      setSaving(false);
    }
  };

  const verifyNow = async () => {
    setSaving(true);
    const res = await adminFetch(`/api/admin/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        verification_status: "VERIFIED",
        last_verified_at: new Date().toISOString(),
      }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to verify job");
    }
    setSaving(false);
  };

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (!job) {
    return <p className="text-red-500">Job not found</p>;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
        <button
          onClick={verifyNow}
          disabled={saving}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          Verify Now
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Title *
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company *
          </label>
          <input
            type="text"
            name="company"
            value={form.company}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Type *
            </label>
            <select
              name="location_type"
              value={form.location_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">Onsite</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salary Min
            </label>
            <input
              type="number"
              name="salary_min"
              value={form.salary_min}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salary Max
            </label>
            <input
              type="number"
              name="salary_max"
              value={form.salary_max}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apply URL *
          </label>
          <input
            type="url"
            name="apply_url"
            value={form.apply_url}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <a
            href={form.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline mt-1 inline-block"
          >
            Test link &rarr;
          </a>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source URL *
          </label>
          <input
            type="url"
            name="source_url"
            value={form.source_url}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Verification Status
          </label>
          <select
            name="verification_status"
            value={form.verification_status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="EXPIRED">Expired</option>
            <option value="BROKEN_LINK">Broken Link</option>
            <option value="NOT_HIRING">Not Hiring</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Verification Notes
          </label>
          <textarea
            name="verification_notes"
            value={form.verification_notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Notes about verification status..."
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
