import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const mockPatrons = [
  {
    id: 1,
    category: "Tech & SaaS",
    type: "Grant",
    title: "EU Horizon Seed Fund 2026",
    description:
      "Early stage non-dilutive capital for software startups building cloud infrastructure.",
    amount: "€50,000",
    deadline: "Closes in 12 days",
  },
  {
    id: 2,
    category: "Biotech",
    type: "Stipend",
    title: "BioBridge Research Stipend",
    description:
      "Funding for early-stage biotech research with commercial potential.",
    amount: "€25,000",
    deadline: "Closes in 28 days",
  },
  {
    id: 3,
    category: "Clean Energy",
    type: "Grant",
    title: "Nordic Innovation Grant",
    description:
      "Non-dilutive capital for clean energy startups in the Nordics.",
    amount: "€75,000",
    deadline: "Closes in 45 days",
  },
];

export default function Home() {
  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Welcome to <span className="text-lumen-teal">Lumen</span>
          <span className="text-patron-gold">Patrons</span>
        </h2>
        <p className="text-foreground/55 mb-8">
          Find non-dilutive capital and institutional backing without the
          noise.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPatrons.map((patron) => (
            <Card key={patron.id} hover>
              <div className="flex justify-between items-start mb-4">
                <Badge>{patron.category}</Badge>
                <span className="text-foreground/40 text-sm group-hover:text-patron-gold transition-colors">
                  {patron.type}
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
                  {patron.amount}
                </span>
                <span className="text-foreground/40">{patron.deadline}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
