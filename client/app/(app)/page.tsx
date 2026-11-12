"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SaveButton } from "@/components/discover/SaveButton";
import {
  getFundingOpportunities,
  getSavedOpportunities,
  type FundingOpportunity,
} from "@/lib/api";
import { deadlineLabel, formatAmount } from "@/lib/format";

export default function Home() {
  const [patrons, setPatrons] = useState<FundingOpportunity[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    getSavedOpportunities()
      .then((items) => {
        if (!mounted) return;
        setSavedIds(new Set(items.map((item) => item.opportunity.id)));
      })
      .catch((err) => {
        // Discover still works without this; cards just start as unsaved.
        console.error(err);
      });

    getFundingOpportunities()
      .then((data) => {
        if (!mounted) return;
        setPatrons(data);
      })
      .catch((err) => {
        console.error(err);
        if (!mounted) return;
        setError("Failed to load funding opportunities");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Welcome to <span className="text-lumen-teal">Lumen</span>
          <span className="text-patron-gold">Patrons</span>
        </h2>
        <p className="text-foreground/55 mb-8">
          Find non-dilutive capital and institutional backing without the noise.
        </p>

        {loading ? (
          <div className="text-center text-foreground/55">Loading...</div>
        ) : error ? (
          <div className="text-center text-danger">{error}</div>
        ) : patrons && patrons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patrons.map((patron) => (
              <Card key={patron.id} hover>
                <div className="flex justify-between items-start mb-4">
                  <Badge>{patron.category?.length ? patron.category.join(", ") : "General"}</Badge>
                  <span className="text-foreground/40 text-sm group-hover:text-patron-gold transition-colors">
                    Grant
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {patron.title}
                </h3>
                <p className="text-sm text-foreground/55 mb-4 line-clamp-2">
                  {patron.patronName}
                </p>
                <div className="flex justify-between items-center text-sm border-t border-lumen-teal/10 pt-4">
                  <span className="text-patron-gold font-semibold">
                    {formatAmount(patron.estimatedAmount, patron.currency)}
                  </span>
                  <span className="text-foreground/40">
                    {deadlineLabel(patron.deadline, patron.status)}
                  </span>
                </div>
                <SaveButton opportunityId={patron.id} alreadySaved={savedIds.has(patron.id)} />
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-foreground/55">
            No funding opportunities found.
          </div>
        )}
      </div>
    </div>
  );
}
