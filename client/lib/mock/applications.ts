export type MockOpportunity = {
  title: string;
  patronName: string;
  category: string;
  minimumAmount: number;
  deadline: string;
  externalUrl: string;
};

export type MockApplication = {
  id: string;
  status: "Saved" | "Applied" | "Submitted";
  savedAt: string;
  opportunity: MockOpportunity;
};

export const mockApplications: MockApplication[] = [
  {
    id: "app-1",
    status: "Saved",
    savedAt: "2026-06-20",
    opportunity: {
      title: "EU Horizon Seed Fund 2026",
      patronName: "Horizon EU",
      category: "Tech & SaaS",
      minimumAmount: 50000,
      deadline: "2026-07-15",
      externalUrl: "https://example.com/horizon",
    },
  },
  {
    id: "app-2",
    status: "Applied",
    savedAt: "2026-06-10",
    opportunity: {
      title: "Nordic Innovation Grant",
      patronName: "Innovation Fund Denmark",
      category: "Clean Energy",
      minimumAmount: 75000,
      deadline: "2026-08-01",
      externalUrl: "https://example.com/nordic",
    },
  },
  {
    id: "app-3",
    status: "Submitted",
    savedAt: "2026-05-28",
    opportunity: {
      title: "BioBridge Research Stipend",
      patronName: "BioBridge Foundation",
      category: "Biotech",
      minimumAmount: 25000,
      deadline: "2026-06-30",
      externalUrl: "https://example.com/biobridge",
    },
  },
];

export const applicationStatusFilters = [
  "All",
  "Saved",
  "Applied",
  "Submitted",
] as const;

export type ApplicationStatusFilter =
  (typeof applicationStatusFilters)[number];
