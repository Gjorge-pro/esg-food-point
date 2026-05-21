import { ChevronRight } from 'lucide-react';

export function SubCategoryList({
  subCategories,
  selectedSubCategory,
  onSelectSubCategory,
  isLoading
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 py-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-[var(--bg-main)] rounded-xl" />
        ))}
      </div>
    );
  }

  if (subCategories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--text-secondary)]">Select a category to see subcategories</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wide">
        Subcategories
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {subCategories.map(subCategory => (
          <button
            key={subCategory.id}
            onClick={() => onSelectSubCategory(subCategory.id)}
            className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
              selectedSubCategory === subCategory.id
                ? 'bg-[var(--color-primary)] text-white shadow-md'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] hover:shadow-md active:scale-95'
            }`}
          >
            <span className="font-medium text-sm">{subCategory.name}</span>
            {selectedSubCategory === subCategory.id && <ChevronRight size={16} />}
          </button>
        ))}
      </div>
    </div>
  );
}
