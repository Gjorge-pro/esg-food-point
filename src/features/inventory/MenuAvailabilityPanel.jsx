import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Eye, EyeOff } from 'lucide-react';

export function MenuAvailabilityPanel() {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMenuItems();
    return subscribeToMenuChanges();
  }, []);

  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, price, available, categories(name)')
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (err) {
      console.error('Error fetching menu items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToMenuChanges = () => {
    if (!supabase) return;

    const channel = supabase
      .channel('menu-availability')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        (payload) => {
          console.log('🔄 Menu item updated:', payload);
          fetchMenuItems();
        }
      )
      .subscribe();

    return () => channel.unsubscribe();
  };

  const toggleAvailability = async (itemId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ available: !currentStatus })
        .eq('id', itemId);

      if (error) throw error;

      // Optimistic update
      setMenuItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, available: !currentStatus } : item
        )
      );

      console.log(`✅ Item ${itemId} availability toggled`);
    } catch (err) {
      console.error('Error toggling availability:', err);
    }
  };

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Menu Availability</h2>
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="app-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-ink/60">Loading...</div>
      ) : (
        <div className="grid gap-2">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-ink/60">No items found</div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 transition hover:bg-brand-50"
              >
                <div className="flex-1">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-ink/65">
                    {item.categories?.name} • TSH {item.price.toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => toggleAvailability(item.id, item.available)}
                  className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition ${
                    item.available
                      ? 'app-status-success'
                      : 'app-status-error'
                  }`}
                >
                  {item.available ? (
                    <>
                      <Eye size={18} />
                      Available
                    </>
                  ) : (
                    <>
                      <EyeOff size={18} />
                      Out of Stock
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Toggle items one-click to mark as available or out of stock. Customers see changes instantly.
        </p>
      </div>
    </div>
  );
}
