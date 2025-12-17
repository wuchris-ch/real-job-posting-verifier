export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return "Salary not listed";

  const formatK = (n: number) => `$${Math.round(n / 1000)}k`;

  if (min && max) {
    return `${formatK(min)} - ${formatK(max)}`;
  }
  if (min) return `${formatK(min)}+`;
  if (max) return `Up to ${formatK(max)}`;
  return "Salary not listed";
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
