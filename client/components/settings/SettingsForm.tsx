"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AccountDangerZone } from "@/components/settings/AccountDangerZone";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { userTypeOptions } from "@/lib/options";
import { getMyProfile, updateMyProfile } from "@/lib/profile";
import { useAuth } from "@/providers/AuthProvider";

type SettingsProfile = {
  fullName: string;
  userType: string;
};

export function SettingsForm() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<SettingsProfile>({
    fullName: user?.fullName ?? "",
    userType: user?.userType ?? userTypeOptions[0],
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
            <p className="text-sm text-success bg-success-soft px-3 py-2 rounded-lg">
              Profile saved successfully!
            </p>
          )}
          {profileError && (
            <p className="text-sm text-danger bg-danger-soft px-3 py-2 rounded-lg">
              {profileError}
            </p>
          )}
          <Button type="submit" disabled={isSaving || !profile.fullName.trim()}>
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-foreground mb-2">Appearance</h3>
        <p className="text-xs text-foreground/45 mb-4">
          System follows your device. Saved on this device only.
        </p>
        <ThemePicker />
      </Card>

      <AccountDangerZone />
    </div>
  );
}
