"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { deleteOpportunity, getFundingOpportunities, type FundingOpportunity } from "@/lib/api";

type OpportunityAdminListProps = {
  /** Changing this value reloads the list (used after an import). */
  refreshKey: number;
};

export function OpportunityAdminList({ refreshKey }: OpportunityAdminListProps) {
  const [items, setItems] = useState<FundingOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    getFundingOpportunities().then((data) => {
      if (!active) return;
      setItems(data);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [refreshKey, reloadKey]);

  async function handleDelete(item: FundingOpportunity) {
    if (!window.confirm(`Delete “${item.title}”? Users who saved it will lose it.`)) return;
    setError(null);
    try {
      await deleteOpportunity(item.id);
      setReloadKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete this opportunity.");
    }
  }

  if (isLoading) return <p className="text-foreground/55">Loading...</p>;

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {items.length === 0 && <p className="text-foreground/55">No opportunities yet.</p>}
      {items.map((item) => (
        <Card key={item.id} className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{item.title}</p>
            <p className="text-sm text-foreground/55 truncate">{item.patronName}</p>
            {item.externalUrl && (
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-lumen-teal hover:underline break-all"
              >
                {item.externalUrl}
              </a>
            )}
          </div>
          <Button variant="ghost" onClick={() => handleDelete(item)}>
            Delete
          </Button>
        </Card>
      ))}
    </div>
  );
}
