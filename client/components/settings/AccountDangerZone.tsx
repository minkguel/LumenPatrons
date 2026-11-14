"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { deleteMyAccount, exportMyData } from "@/lib/profile";
import { useAuth } from "@/providers/AuthProvider";

const CONFIRM_WORD = "DELETE";

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before the URL goes away.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AccountDangerZone() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleExport() {
    setExportError(null);
    setIsExporting(true);
    try {
      saveBlob(await exportMyData(), "lumenpatrons-export.json");
    } catch (err) {
      console.error("Failed to export data", err);
      setExportError("Could not download your data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDelete() {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteMyAccount();
    } catch (err) {
      console.error("Failed to delete account", err);
      setDeleteError("Your account could not be deleted. Nothing was removed.");
      setIsDeleting(false);
      return;
    }
    try {
      await signOut();
    } catch (err) {
      // The login is already gone, so a failed sign-out call must not block leaving.
      console.error("Sign-out after deletion failed", err);
    }
    router.replace("/auth");
  }

  function cancelDelete() {
    setConfirming(false);
    setConfirmText("");
    setDeleteError(null);
  }

  return (
    <Card>
      <h3 className="text-lg font-bold text-foreground mb-2">Your data</h3>
      <p className="text-xs text-foreground/45 mb-4">
        Download everything we store about you, or permanently delete your account.
      </p>

      <div className="space-y-6">
        <div className="space-y-3">
          {exportError && (
            <p className="text-sm text-danger bg-danger-soft px-3 py-2 rounded-lg">{exportError}</p>
          )}
          <Button type="button" variant="secondary" onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Preparing…" : "Download my data"}
          </Button>
        </div>

        <div className="space-y-3 border-t border-lumen-teal/15 pt-6">
          {!confirming ? (
            <Button type="button" variant="ghost" className="text-danger" onClick={() => setConfirming(true)}>
              Delete account
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-foreground/70">
                This permanently deletes your login, profile and saved opportunities. It cannot be undone.
              </p>
              <Input
                label={`Type ${CONFIRM_WORD} to confirm`}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
              />
              {deleteError && (
                <p className="text-sm text-danger bg-danger-soft px-3 py-2 rounded-lg">{deleteError}</p>
              )}
              <div className="flex gap-3">
                <Button
                  type="button"
                  className="!bg-danger !text-bg-cream"
                  onClick={handleDelete}
                  disabled={confirmText !== CONFIRM_WORD || isDeleting}
                >
                  {isDeleting ? "Deleting…" : "Delete my account"}
                </Button>
                <Button type="button" variant="ghost" onClick={cancelDelete} disabled={isDeleting}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
