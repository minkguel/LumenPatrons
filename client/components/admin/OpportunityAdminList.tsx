"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  MAX_LIST_ROWS,
  deleteOpportunity,
  getFundingOpportunities,
  type FundingOpportunity,
} from "@/lib/api";

type OpportunityAdminListProps = {
  /** Changing this value reloads the list (used after an import). */
  refreshKey: number;
};

export function OpportunityAdminList({ refreshKey }: OpportunityAdminListProps) {
  const [items, setItems] = useState<FundingOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);
  const [filterText, setFilterText] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");

  useEffect(() => {
    let active = true;
    getFundingOpportunities({ q: appliedFilter, includeClosed: true })
      .then((data) => {
        if (!active) return;
        setItems(data);
        setLoadFailed(false);
      })
      .catch((e) => {
        console.error(e);
        if (!active) return;
        setLoadFailed(true);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey, reloadKey, appliedFilter]);

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

  function handleFilter(event: React.FormEvent) {
    event.preventDefault();
    setAppliedFilter(filterText.trim());
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleFilter} className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            label="Filter opportunities"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            maxLength={100}
          />
        </div>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>
      {isLoading && <p className="text-foreground/55">Loading...</p>}
      {error && (
        <p role="alert" className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {loadFailed && (
        <p role="alert" className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">
          Could not load opportunities.{" "}
          <button className="underline" onClick={() => setReloadKey((k) => k + 1)}>
            Try again
          </button>
        </p>
      )}
      {!isLoading && items.length === MAX_LIST_ROWS && (
        <p className="text-sm text-foreground/55">Showing the first {MAX_LIST_ROWS}. Use the filter to find others.</p>
      )}
      {!isLoading && !loadFailed && items.length === 0 && <p className="text-foreground/55">No opportunities yet.</p>}
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
