import { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { getInventoryByMenuIds } from '../../lib/inventoryService';

export function MenuBrowser({ onAddToCart }) {
  const { mainCategories, getSubCategories, fetchMenuItemsByCategory, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');

  const subCategories = useMemo(
    () => selectedMainCategory ? getSubCategories(selectedMainCategory) : [],
    [selectedMainCategory, getSubCategories]
  );

  // Auto-select first main category
  useEffect(() => {
    if (mainCategories.length > 0 && !selectedMainCategory) {
      console.log('Auto-selecting first main category:', mainCategories[0]);
      setSelectedMainCategory(mainCategories[0].id);
    }
  }, [mainCategories, selectedMainCategory]);

  // Auto-select first subcategory when main category changes
  useEffect(() => {
    if (subCategories.length > 0) {
      console.log('Auto-selecting first subcategory:', subCategories[0]);
      setSelectedSubCategory(subCategories[0].id);
    } else {
      setSelectedSubCategory(null);
      setMenuItems([]);
    }
  }, [subCategories]);

  // Fetch menu items when subcategory changes
  useEffect(() => {
    if (selectedSubCategory) {
      loadMenuItems(selectedSubCategory);
    }
  }, [selectedSubCategory]);

  const loadMenuItems = async (subCategoryId) => {
    setIsLoading(true);
    try {
      console.log('Loading menu items for subcategory:', subCategoryId);
      const items = await fetchMenuItemsByCategory(subCategoryId);
      const inventoryByMenuId = await getInventoryByMenuIds(items.map((item) => item.id));
      const enrichedItems = items.map((item) => {
        const inventory = inventoryByMenuId[item.id];
        const blockedByStock = inventory?.prevent_order_when_empty && Number(inventory.stock_quantity || 0) <= 0;

        return {
          ...item,
          inventory,
          available: item.available && !blockedByStock,
        };
      });
      console.log('Loaded items:', enrichedItems);
      setMenuItems(enrichedItems);
    } catch (err) {
      console.error('Failed to load menu items:', err);
      setMenuItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedItem?.available) {
      return;
    }

    onAddToCart({
      menuItemId: selectedItem.id,
      menuItem: selectedItem,
      quantity,
      instructions
    });

    // Reset form
    setSelectedItem(null);
    setQuantity(1);
    setInstructions('');
  };

  const handleMainCategoryChange = (categoryId) => {
    console.log('Changing main category to:', categoryId);
    setSelectedMainCategory(categoryId);
    setSelectedSubCategory(null);
    setMenuItems([]);
  };

  // Show loading only if initially loading categories
  if (categoriesLoading && mainCategories.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-100 dark:border-brand-800 bg-white dark:bg-gray-800 p-8 shadow-panel">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading categories...</p>
      </div>
    );
  }

  if (categoriesError && mainCategories.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-8 shadow-panel">
        <p className="text-center text-red-600 dark:text-red-300">Error: {categoriesError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Categories */}
      {mainCategories.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-semibold">MAIN CATEGORIES</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {mainCategories.map(category => (
              <button
                key={category.id}
                onClick={() => handleMainCategoryChange(category.id)}
                className={`px-4 py-2 rounded-2xl whitespace-nowrap font-medium transition ${
                  selectedMainCategory === category.id
                    ? 'bg-brand-500 text-white'
                    : 'bg-brand-50 text-gray-900 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-gray-100 dark:hover:bg-brand-800/30'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subcategories */}
      {selectedMainCategory && subCategories.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-semibold">SUBCATEGORIES</p>
          <div className="flex gap-2 overflow-x-auto pb-2 pl-2 border-l-4 border-brand-100">
            {subCategories.map(subCategory => (
              <button
                key={subCategory.id}
                onClick={() => setSelectedSubCategory(subCategory.id)}
                className={`px-4 py-2 rounded-2xl whitespace-nowrap font-medium transition ${
                  selectedSubCategory === subCategory.id
                    ? 'bg-brand-500 text-white'
                    : 'bg-brand-100 text-gray-900 hover:bg-brand-200 dark:bg-brand-900/30 dark:text-gray-100 dark:hover:bg-brand-800/40'
                }`}
              >
                {subCategory.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      <div>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-100"></div>
            </div>
            <p className="mt-3 text-gray-600 dark:text-gray-400">Loading items...</p>
          </div>
        ) : menuItems && menuItems.length > 0 ? (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-semibold">ITEMS</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map(item => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 transition-all duration-200 ${
                    item.available
                      ? 'cursor-pointer border-[var(--border)] bg-[var(--bg-card)] shadow-sm hover:shadow-md hover:scale-[1.02]'
                      : 'cursor-not-allowed border-[var(--border)] bg-[var(--bg-main)] opacity-60'
                  }`}
                  onClick={() => {
                    if (!item.available) return;
                    setSelectedItem(item);
                    setQuantity(1);
                    setInstructions('');
                  }}
                >
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                    {!item.available ? (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-red-600 dark:text-red-400">
                        Out of stock
                      </p>
                    ) : null}
                    {item.inventory ? (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Stock: {Number(item.inventory.stock_quantity).toLocaleString()} {item.inventory.unit}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-brand-700 dark:text-brand-300">
                      {Number(item.price).toLocaleString()} TSH
                    </p>
                    <div
                      className={`rounded-lg p-2 ${
                        item.available ? 'bg-brand-50 dark:bg-brand-900/30' : 'bg-red-100 dark:bg-red-900/30'
                      }`}
                    >
                      <Plus size={18} className="text-gray-900 dark:text-gray-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : selectedSubCategory ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No items available in this category</p>
          </div>
        ) : null}
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm p-4 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-lg border border-[var(--border)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{selectedItem.name}</h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-[var(--bg-main)] rounded-lg transition duration-200"
              >
                <X size={20} className="text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* Price */}
            <div className="mb-6 p-4 bg-[var(--color-primary)]/10 rounded-xl border border-[var(--color-primary)]/20">
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.08em]">Price</p>
              <p className="text-2xl font-bold text-[var(--color-primary)] mt-1">
                {Number(selectedItem.price).toLocaleString()} TSH
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Quantity</label>
              <div className="flex items-center gap-3 bg-[var(--bg-main)] rounded-xl p-3 w-fit border border-[var(--border)]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-[var(--bg-card)] rounded-lg transition duration-200"
                >
                  <Minus size={18} />
                </button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-[var(--bg-card)] rounded-lg transition duration-200"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                Special Instructions (optional)
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="No onions, extra spicy, etc."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none resize-none transition-all duration-200"
                rows="3"
              />
            </div>

            {/* Total */}
            <div className="mb-6 p-4 bg-[var(--color-primary)]/10 rounded-xl border border-[var(--color-primary)]/20">
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-[0.08em]">Subtotal</p>
              <p className="text-2xl font-bold text-[var(--color-primary)] mt-1">
                {(Number(selectedItem.price) * quantity).toLocaleString()} TSH
              </p>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!selectedItem.available}
              className="w-full rounded-xl bg-[var(--color-primary)] py-3 font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedItem.available ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

