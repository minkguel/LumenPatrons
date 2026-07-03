"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getFundingOpportunities, type FundingOpportunity } from "@/lib/api";

function formatAmount(amount?: number | null) {
  if (!amount && amount !== 0) return "—";
  try {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `€${amount}`;
  }
}

function daysUntil(iso?: string) {
  if (!iso) return "No deadline";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (isNaN(diff)) return "No deadline";
  if (diff <= 0) return "Closed";
  if (diff === 1) return "Closes in 1 day";
  return `Closes in ${diff} days`;
}

export default function Home() {
  const [patrons, setPatrons] = useState<FundingOpportunity[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
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
          <div className="text-center text-red-600">{error}</div>
        ) : patrons && patrons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patrons.map((patron) => (
              <Card key={patron.id} hover>
                <div className="flex justify-between items-start mb-4">
                  <Badge>{patron.category ?? "General"}</Badge>
                  <span className="text-foreground/40 text-sm group-hover:text-patron-gold transition-colors">
                    {patron.isPremiumOnly ? "Premium" : "Grant"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {patron.title}
                </h3>
                <p className="text-sm text-foreground/55 mb-4 line-clamp-2">
                  {patron.description}
                </p>
                <div className="flex justify-between items-center text-sm border-t border-lumen-teal/10 pt-4">
                  <span className="text-patron-gold font-semibold">
                    {formatAmount(patron.minimumAmount)}
                  </span>
                  <span className="text-foreground/40">
                    {daysUntil(patron.deadline)}
                  </span>
                </div>
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
