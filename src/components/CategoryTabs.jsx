import { ChevronRight } from 'lucide-react';

export function CategoryTabs({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  isLoading 
}) {
  if (isLoading) {
    return (
      <div className="flex gap-2 pb-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 w-24 bg-[var(--bg-main)] rounded-xl" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return <div className="text-ink/60 py-4">No categories available</div>;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4">
      {categories.map(category => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl whitespace-nowrap transition-all duration-200 font-semibold ${
            selectedCategory === category.id
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--border)] active:scale-95'
          }`}
        >
          <span>{category.name}</span>
          {selectedCategory === category.id && <ChevronRight size={18} />}
        </button>
      ))}
    </div>
  );
}
