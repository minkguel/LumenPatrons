const DAY_MS = 1000 * 60 * 60 * 24;

export function formatAmount(
  amount: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return "—";
  const value = Number(amount);
  if (!currency) return value.toLocaleString("en-GB", { maximumFractionDigits: 0 });
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    // Not a valid ISO 4217 code (e.g. "kr"): show the number with the raw text.
    return `${value.toLocaleString("en-GB", { maximumFractionDigits: 0 })} ${currency}`;
  }
}

export function deadlineLabel(
  deadlineIso: string | null | undefined,
  status?: string,
  now: Date = new Date(),
): string {
  if (!deadlineIso) return "No deadline";
  const deadline = new Date(deadlineIso).getTime();
  if (Number.isNaN(deadline)) return "No deadline";
  if (status?.toLowerCase() === "closed") return "Closed";
  const diff = deadline - now.getTime();
  if (diff < 0) return "Closed";
  if (diff < DAY_MS) return "Closes today";
  const days = Math.ceil(diff / DAY_MS);
  return days === 1 ? "Closes in 1 day" : `Closes in ${days} days`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
