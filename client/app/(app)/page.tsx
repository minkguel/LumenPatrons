"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DiscoverFilters } from "@/components/discover/DiscoverFilters";
import { OpportunityCard } from "@/components/discover/OpportunityCard";
import {
  getCategories,
  getFundingOpportunities,
  getSavedOpportunities,
  type FundingOpportunity,
} from "@/lib/api";
import { discoverQuery } from "@/lib/discover";

function Discover() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";

  const [retryKey, setRetryKey] = useState(0);
  const requestKey = `${q}
${category}
${retryKey}`;
  // The result remembers which request it answers, so "loading" is derived, not set in an effect.
  const [result, setResult] = useState<{
    key: string;
    data: FundingOpportunity[] | null;
  } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
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
    getCategories()
      .then((names) => {
        if (mounted) setCategories(names);
      })
      .catch((err) => {
        // Discover still works without this; there are just no category buttons.
        console.error(err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getFundingOpportunities({ q, category })
      .then((data) => {
        if (mounted) setResult({ key: requestKey, data });
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setResult({ key: requestKey, data: null });
      });
    return () => {
      mounted = false;
    };
  }, [q, category, requestKey]);

  const loading = result?.key !== requestKey;
  const patrons = result?.data ?? null;
  const error = !loading && result?.data === null;
  const hasFilter = q !== "" || category !== "";

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

        <DiscoverFilters
          categories={categories}
          selected={category || undefined}
          onSelect={(next) => router.push(`/${discoverQuery({ q, category: next })}`)}
        />

        {loading ? (
          <div className="text-center text-foreground/55">Loading...</div>
        ) : error ? (
          <div className="text-center text-danger space-y-3">
            <p>Could not load funding opportunities.</p>
            <Button variant="secondary" onClick={() => setRetryKey((k) => k + 1)}>
              Try again
            </Button>
          </div>
        ) : patrons && patrons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patrons.map((patron) => (
              <OpportunityCard
                key={patron.id}
                opportunity={patron}
                alreadySaved={savedIds.has(patron.id)}
              />
            ))}
          </div>
        ) : hasFilter ? (
          <div className="text-center text-foreground/55 space-y-3">
            <p>Nothing matches your search.</p>
            <Button variant="secondary" onClick={() => router.push("/")}>
              Clear search
            </Button>
          </div>
        ) : (
          <div className="text-center text-foreground/55">No funding opportunities yet.</div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-foreground/55">Loading...</div>}>
      <Discover />
    </Suspense>
  );
}
