"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { saveOpportunity } from "@/lib/api";

type SaveButtonProps = {
  opportunityId: string;
  alreadySaved: boolean;
};

export function SaveButton({ opportunityId, alreadySaved }: SaveButtonProps) {
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saved = alreadySaved || justSaved;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveOpportunity(opportunityId);
      setJustSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this opportunity.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4">
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={saved || saving}
        onClick={handleSave}
      >
        {saved ? "Saved" : saving ? "Saving…" : "Save"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
