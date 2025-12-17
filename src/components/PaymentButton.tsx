"use client";

import { useState } from "react";

interface PaymentButtonProps {
  className?: string;
}

export function PaymentButton({ className = "" }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
      });

      const data = await res.json();

      if (data.error) {
        if (data.redirect) {
          window.location.href = data.redirect;
        } else {
          setError(data.error);
        }
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`bg-green-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 ${className}`}
      >
        {loading ? "Loading..." : "Get Full Access - $1"}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
