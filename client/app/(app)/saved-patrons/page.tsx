import { SavedPatronList } from "@/components/saved-patrons/SavedPatronList";

export default function SavedPatronsPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Saved Patrons
        </h2>
        <p className="text-foreground/55 mb-8">
          Keep track of your saved funding opportunities.
        </p>
        <SavedPatronList />
      </div>
    </div>
  );
}
