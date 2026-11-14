export const userTypeOptions = ["Founder", "Researcher", "Non-profit"];

export const savedStatusFilters = [
  "All",
  "Saved",
  "Submitted",
] as const;

export type SavedStatusFilter =
  (typeof savedStatusFilters)[number];
