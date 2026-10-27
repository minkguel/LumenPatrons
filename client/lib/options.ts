export const userTypeOptions = ["Founder", "Researcher", "Non-profit"];

export const categoryOptions = [
  "Tech & SaaS",
  "Biotech",
  "Clean Energy",
  "Social Impact",
  "Arts & Culture",
];

export const savedStatusFilters = [
  "All",
  "Saved",
  "Applied",
  "Submitted",
] as const;

export type SavedStatusFilter =
  (typeof savedStatusFilters)[number];
