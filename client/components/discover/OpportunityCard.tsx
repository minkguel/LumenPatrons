import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SaveButton } from "@/components/discover/SaveButton";
import type { FundingOpportunity } from "@/lib/api";
import { deadlineLabel, formatAmount } from "@/lib/format";

type OpportunityCardProps = {
  opportunity: FundingOpportunity;
  alreadySaved: boolean;
};

export function OpportunityCard({ opportunity, alreadySaved }: OpportunityCardProps) {
  return (
    <Card hover>
      <div className="flex justify-between items-start mb-4">
        <Badge>
          {opportunity.category?.length ? opportunity.category.join(", ") : "General"}
        </Badge>
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1">
        <Link href={`/opportunities/${opportunity.id}`} className="hover:text-lumen-teal hover:underline">
          {opportunity.title}
        </Link>
      </h3>
      <p className="text-sm text-foreground/55 mb-4 line-clamp-2">{opportunity.patronName}</p>
      <div className="flex justify-between items-center text-sm border-t border-lumen-teal/10 pt-4">
        <span className="text-patron-gold font-semibold">
          {formatAmount(opportunity.estimatedAmount, opportunity.currency)}
        </span>
        <span className="text-foreground/40">
          {deadlineLabel(opportunity.deadline, opportunity.status)}
        </span>
      </div>
      <SaveButton opportunityId={opportunity.id} alreadySaved={alreadySaved} />
    </Card>
  );
}
