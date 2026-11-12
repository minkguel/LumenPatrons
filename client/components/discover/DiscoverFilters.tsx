type DiscoverFiltersProps = {
  categories: string[];
  selected?: string;
  onSelect: (category: string | undefined) => void;
};

function chipClass(active: boolean) {
  return `px-3 py-1.5 text-sm rounded-full border transition-colors ${
    active
      ? "bg-lumen-teal text-on-primary border-lumen-teal"
      : "bg-surface text-foreground/70 border-lumen-teal/25 hover:border-lumen-teal"
  }`;
}

export function DiscoverFilters({ categories, selected, onSelect }: DiscoverFiltersProps) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button aria-pressed={!selected} onClick={() => onSelect(undefined)} className={chipClass(!selected)}>
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          aria-pressed={selected === category}
          onClick={() => onSelect(category)}
          className={chipClass(selected === category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
