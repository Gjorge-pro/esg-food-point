import { useState } from 'react';
import { Panel } from '../../../components/Panel';
import { supabase } from '../../../lib/supabaseClient';
import { printReceipt } from '../../../lib/receiptService';

export function ReceiptLookupPanel({ notify }) {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);

  const printOrderReceipt = async (event) => {
    event.preventDefault();
    if (!orderId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, payment_method, payment_status, order_items(quantity, menu_items(id, name, price))')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      printReceipt(data);
    } catch (error) {
      notify?.(error.message || 'Could not load receipt.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel title="Receipt Lookup" subtitle="Print a customer receipt by order ID.">
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={printOrderReceipt}>
        <input
          type="number"
          min="1"
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
          className="flex-1 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
          placeholder="Order ID"
        />
        <button
          type="submit"
          disabled={loading || !orderId}
          className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          Print Receipt
        </button>
      </form>
    </Panel>
  );
}

export default ReceiptLookupPanel;
