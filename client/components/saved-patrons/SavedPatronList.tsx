"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  deleteSavedOpportunity,
  getSavedOpportunities,
  type SavedOpportunity,
} from "@/lib/api";
import {
  savedStatusFilters,
  type SavedStatusFilter,
} from "@/lib/options";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return "Closed";
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes in 1 day";
  return `Closes in ${days} days`;
}

export function SavedPatronList() {
  const [filter, setFilter] = useState<SavedStatusFilter>("All");
  const [savedItems, setSavedItems] = useState<SavedOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getSavedOpportunities()
      .then((saved) => {
        if (active) setSavedItems(saved);
      })
      .catch((err) => {
        console.error("Failed to load saved patrons", err);
        if (active) setError("Could not load your saved patrons. Please try again.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "All") return savedItems;
    return savedItems.filter((item) => item.status === filter);
  }, [savedItems, filter]);

  async function handleRemove(id: string) {
    setError(null);
    try {
      await deleteSavedOpportunity(id);
      setSavedItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to remove saved patron", err);
      setError("Could not remove the saved patron. Please try again.");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {savedStatusFilters.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === status
                ? "bg-lumen-teal text-white"
                : "bg-white border border-lumen-teal/20 text-foreground/60 hover:text-lumen-teal hover:border-lumen-teal/40"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-center py-16 text-foreground/55">
          Loading saved patrons…
        </p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📁</p>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No saved patrons yet
          </h3>
          <p className="text-foreground/55 mb-6 max-w-sm mx-auto">
            Save funding opportunities from Discover Patrons to track them here.
          </p>
          <Link href="/">
            <Button>Discover Patrons</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {item.opportunity.category?.map((category) => (
                      <Badge key={category}>{category}</Badge>
                    ))}
                    <Badge variant="status">{item.status}</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {item.opportunity.title}
                  </h3>
                  <p className="text-sm text-foreground/55 mb-3">
                    {item.opportunity.patronName}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    {item.opportunity.minimumAmount != null && (
                      <span className="text-patron-gold font-semibold">
                        {formatAmount(item.opportunity.minimumAmount)}
                      </span>
                    )}
                    {item.opportunity.deadline && (
                      <span className="text-foreground/45">
                        {daysUntil(item.opportunity.deadline)}
                      </span>
                    )}
                    <span className="text-foreground/45">
                      Saved {formatDate(item.savedAt)}
                    </span>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  {item.opportunity.externalUrl && (
                    <a
                      href={item.opportunity.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="secondary" className="w-full sm:w-auto">
                        View Opportunity
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full sm:w-auto"
                    onClick={() => handleRemove(item.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
