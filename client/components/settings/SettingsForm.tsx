"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { categoryOptions, userTypeOptions } from "@/lib/options";
import { getMyProfile, updateMyProfile } from "@/lib/profile";
import { useAuth } from "@/providers/AuthProvider";

type UserPreferences = {
  deadlineReminders: boolean;
  newPatronAlerts: boolean;
  defaultCategory: string;
};

type SettingsProfile = {
  fullName: string;
  userType: string;
  // Preferences are not stored by the API yet, so they only live in this form.
  preferences: UserPreferences;
};

const defaultPreferences: UserPreferences = {
  deadlineReminders: true,
  newPatronAlerts: false,
  defaultCategory: categoryOptions[0],
};

export function SettingsForm() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<SettingsProfile>({
    fullName: user?.fullName ?? "",
    userType: user?.userType ?? userTypeOptions[0],
    preferences: defaultPreferences,
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    getMyProfile()
      .then((stored) => {
        if (!active) return;
        const source = stored ?? user;
        setProfile((prev) => ({
          ...prev,
          fullName: source.fullName,
          userType: source.userType,
        }));
      })
      .catch((err) => {
        console.error("Failed to load profile", err);
        if (active) setProfileError("Could not load your profile.");
      });
    return () => {
      active = false;
    };
  }, [user]);

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    setProfileError(null);
    setIsSaving(true);
    try {
      const saved = await updateMyProfile({
        fullName: profile.fullName.trim(),
        userType: profile.userType,
      });
      setProfile((prev) => ({
        ...prev,
        fullName: saved.fullName,
        userType: saved.userType,
      }));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save profile", err);
      setProfileError("Could not save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function handlePreferencesSubmit(event: FormEvent) {
    event.preventDefault();
    setPreferencesSaved(true);
    setTimeout(() => setPreferencesSaved(false), 3000);
  }

  function updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) {
    setProfile((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value },
    }));
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <Card>
        <h3 className="text-lg font-bold text-foreground mb-6">Profile Settings</h3>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={profile.fullName}
            onChange={(e) =>
              setProfile({ ...profile, fullName: e.target.value })
            }
          />
          <Input
            label="Email"
            type="email"
            value={user?.email ?? ""}
            readOnly
            className="opacity-60 cursor-not-allowed"
          />
          <Select
            label="User Type"
            value={profile.userType}
            onChange={(e) =>
              setProfile({ ...profile, userType: e.target.value })
            }
            options={userTypeOptions.map((type) => ({
              value: type,
              label: type,
            }))}
          />
          {profileSaved && (
            <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              Profile saved successfully!
            </p>
          )}
          {profileError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {profileError}
            </p>
          )}
          <Button type="submit" disabled={isSaving || !profile.fullName.trim()}>
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-foreground mb-6">Preferences</h3>

        <form onSubmit={handlePreferencesSubmit} className="space-y-5">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-foreground/80">
                Deadline reminders
              </p>
              <p className="text-xs text-foreground/45">
                Get notified before saved opportunity deadlines
              </p>
            </div>
            <input
              type="checkbox"
              checked={profile.preferences.deadlineReminders}
              onChange={(e) =>
                updatePreference("deadlineReminders", e.target.checked)
              }
              className="w-4 h-4 accent-lumen-teal"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-foreground/80">
                New patron alerts
              </p>
              <p className="text-xs text-foreground/45">
                Email when new funding opportunities match your profile
              </p>
            </div>
            <input
              type="checkbox"
              checked={profile.preferences.newPatronAlerts}
              onChange={(e) =>
                updatePreference("newPatronAlerts", e.target.checked)
              }
              className="w-4 h-4 accent-lumen-teal"
            />
          </label>

          <Select
            label="Default category filter"
            value={profile.preferences.defaultCategory}
            onChange={(e) =>
              updatePreference("defaultCategory", e.target.value)
            }
            options={categoryOptions.map((cat) => ({
              value: cat,
              label: cat,
            }))}
          />

          {preferencesSaved && (
            <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              Preferences saved successfully!
            </p>
          )}
          <Button type="submit">Save Preferences</Button>
        </form>
      </Card>
    </div>
  );
}
