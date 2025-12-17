import { formatDistanceToNow } from "@/lib/utils";

interface VerificationBadgeProps {
  lastVerifiedAt: string | null;
}

export function VerificationBadge({ lastVerifiedAt }: VerificationBadgeProps) {
  if (!lastVerifiedAt) return null;

  const timeAgo = formatDistanceToNow(new Date(lastVerifiedAt));

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
      <svg
        className="w-3 h-3"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      Verified {timeAgo}
    </span>
  );
}
