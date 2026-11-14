"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SaveButton } from "@/components/discover/SaveButton";
import {
  getFundingOpportunity,
  getSavedOpportunities,
  type FundingOpportunity,
} from "@/lib/api";
import { deadlineLabel, formatAmount } from "@/lib/format";

function BackLink() {
  return (
    <Link href="/" className="text-sm text-lumen-teal hover:underline">
      ← Back to Discover
    </Link>
  );
}

function OpportunityDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [retryKey, setRetryKey] = useState(0);
  const requestKey = `${id}
${retryKey}`;
  // The result remembers which request it answers, so "loading" is derived, not set in an effect.
  const [result, setResult] = useState<{
    key: string;
    data: FundingOpportunity | null;
    failed: boolean;
  } | null>(null);
  const [alreadySaved, setAlreadySaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    getFundingOpportunity(id)
      .then((data) => {
        if (mounted) setResult({ key: requestKey, data, failed: false });
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setResult({ key: requestKey, data: null, failed: true });
      });
    return () => {
      mounted = false;
    };
  }, [id, requestKey]);

  useEffect(() => {
    let mounted = true;
    getSavedOpportunities()
      .then((items) => {
        if (mounted) setAlreadySaved(items.some((item) => item.opportunity.id === id));
      })
      .catch((err) => {
        // The page still works; the Save button just starts as unsaved.
        console.error(err);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  const loading = result?.key !== requestKey;

  if (loading) {
    return <div className="p-4 md:p-8 text-center text-foreground/55">Loading...</div>;
  }

  if (result.failed) {
    return (
      <div className="p-4 md:p-8 text-center text-danger space-y-3">
        <p>Could not load this opportunity.</p>
        <Button variant="secondary" onClick={() => setRetryKey((k) => k + 1)}>
          Try again
        </Button>
      </div>
    );
  }

  const opportunity = result.data;
  if (!opportunity) {
    return (
      <div className="p-4 md:p-8 text-center text-foreground/55 space-y-3">
        <p>This opportunity no longer exists.</p>
        <BackLink />
      </div>
    );
  }

  const label = deadlineLabel(opportunity.deadline, opportunity.status);
  const isClosed = label === "Closed";
  const externalUrl =
    opportunity.externalUrl && /^https?:\/\//i.test(opportunity.externalUrl)
      ? opportunity.externalUrl
      : null;

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <BackLink />
        <Card>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {opportunity.category?.map((category) => (
              <Badge key={category}>{category}</Badge>
            ))}
            {isClosed && <Badge variant="neutral">Closed</Badge>}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-1">{opportunity.title}</h1>
          <p className="text-foreground/55 mb-4">{opportunity.patronName}</p>
          <div className="flex flex-wrap justify-between gap-2 text-sm border-t border-lumen-teal/10 pt-4">
            <span className="text-patron-gold font-semibold">
              {formatAmount(opportunity.estimatedAmount, opportunity.currency)}
            </span>
            <span className="text-foreground/40">{label}</span>
          </div>

          {opportunity.description && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Description</h2>
              <p className="text-foreground/80 whitespace-pre-line">{opportunity.description}</p>
            </section>
          )}

          {opportunity.eligibility && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Eligibility</h2>
              <p className="text-foreground/80 whitespace-pre-line">{opportunity.eligibility}</p>
            </section>
          )}

          <SaveButton opportunityId={opportunity.id} alreadySaved={alreadySaved} />

          {externalUrl && (
            <div className="mt-4">
              <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" className="w-full">
                  Go to official page
                </Button>
              </a>
              <p className="mt-2 text-sm text-foreground/55">
                Always check details at the official source.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function OpportunityPage() {
  return (
    <Suspense fallback={<div className="p-4 md:p-8 text-center text-foreground/55">Loading...</div>}>
      <OpportunityDetail />
    </Suspense>
  );
}
