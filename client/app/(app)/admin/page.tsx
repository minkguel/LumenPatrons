"use client";

import { useState } from "react";
import { ImportForm } from "@/components/admin/ImportForm";
import { OpportunityAdminList } from "@/components/admin/OpportunityAdminList";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  if (isLoading) return <div className="p-8 text-foreground/55">Loading...</div>;

  if (!user?.isAdmin) {
    return (
      <div className="p-8">
        <p className="text-foreground/55">You don&apos;t have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Admin</h2>
          <p className="text-foreground/55">Import opportunities from a scraper file and remove old ones.</p>
        </div>
        <ImportForm onImported={() => setRefreshKey((k) => k + 1)} />
        <OpportunityAdminList refreshKey={refreshKey} />
      </div>
    </div>
  );
}
