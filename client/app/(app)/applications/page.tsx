import { ApplicationList } from "@/components/applications/ApplicationList";

export default function ApplicationsPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          My Applications
        </h2>
        <p className="text-foreground/55 mb-8">
          Track saved and submitted funding opportunities in one place.
        </p>
        <ApplicationList />
      </div>
    </div>
  );
}
