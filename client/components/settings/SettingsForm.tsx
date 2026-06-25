"use client";

import { FormEvent, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  categoryOptions,
  mockUserProfile,
  userTypeOptions,
  type UserPreferences,
  type UserProfile,
} from "@/lib/mock/user";

export function SettingsForm() {
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [profileSaved, setProfileSaved] = useState(false);
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
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
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-foreground">Profile Settings</h3>
          <Badge variant="gold">{profile.subscriptionTier} Plan</Badge>
        </div>

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
            value={profile.email}
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
          <Button type="submit">Save Changes</Button>
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
                Get notified before application deadlines
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
