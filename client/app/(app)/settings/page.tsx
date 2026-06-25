import { SettingsForm } from "@/components/settings/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-foreground mb-2">Settings</h2>
        <p className="text-foreground/55 mb-8">
          Manage your profile and notification preferences.
        </p>
        <SettingsForm />
      </div>
    </div>
  );
}
