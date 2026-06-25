export type UserPreferences = {
  deadlineReminders: boolean;
  newPatronAlerts: boolean;
  defaultCategory: string;
};

export type UserProfile = {
  fullName: string;
  email: string;
  userType: string;
  subscriptionTier: string;
  preferences: UserPreferences;
};

export const mockUserProfile: UserProfile = {
  fullName: "Jane Founder",
  email: "jane@example.com",
  userType: "Founder",
  subscriptionTier: "Free",
  preferences: {
    deadlineReminders: true,
    newPatronAlerts: false,
    defaultCategory: "Tech & SaaS",
  },
};

export const userTypeOptions = ["Founder", "Researcher", "Non-profit"];

export const categoryOptions = [
  "Tech & SaaS",
  "Biotech",
  "Clean Energy",
  "Social Impact",
  "Arts & Culture",
];
