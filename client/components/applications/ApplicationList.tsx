"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  applicationStatusFilters,
  mockApplications,
  type ApplicationStatusFilter,
} from "@/lib/mock/applications";

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

export function ApplicationList() {
  const [filter, setFilter] = useState<ApplicationStatusFilter>("All");
  const [applications, setApplications] = useState(mockApplications);

  const filtered = useMemo(() => {
    if (filter === "All") return applications;
    return applications.filter((app) => app.status === filter);
  }, [applications, filter]);

  function handleRemove(id: string) {
    setApplications((prev) => prev.filter((app) => app.id !== id));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {applicationStatusFilters.map((status) => (
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

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📁</p>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No applications yet
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
          {filtered.map((app) => (
            <Card key={app.id}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge>{app.opportunity.category}</Badge>
                    <Badge variant="status">{app.status}</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {app.opportunity.title}
                  </h3>
                  <p className="text-sm text-foreground/55 mb-3">
                    {app.opportunity.patronName}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="text-patron-gold font-semibold">
                      {formatAmount(app.opportunity.minimumAmount)}
                    </span>
                    <span className="text-foreground/45">
                      {daysUntil(app.opportunity.deadline)}
                    </span>
                    <span className="text-foreground/45">
                      Saved {formatDate(app.savedAt)}
                    </span>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <a
                    href={app.opportunity.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="secondary" className="w-full sm:w-auto">
                      View Opportunity
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    className="w-full sm:w-auto"
                    onClick={() => handleRemove(app.id)}
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
