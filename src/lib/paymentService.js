import { supabase } from './supabaseClient';

export async function processPayment(orderId, method = 'cash', options = {}) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const transactionRef = options.transactionRef || `LOCAL-${orderId}-${Date.now()}`;
  const nextStatus = options.status || 'paid';

  const payload = {
    payment_method: method,
    payment_status: nextStatus,
    transaction_ref: nextStatus === 'paid' ? transactionRef : null,
  };

  let { data, error } = await supabase
    .from('orders')
    .update(payload)
    .eq('id', orderId)
    .select()
    .single();

  if (isMissingTransactionRefError(error)) {
    const fallbackPayload = {
      payment_method: method,
      payment_status: nextStatus,
    };

    const fallback = await supabase
      .from('orders')
      .update(fallbackPayload)
      .eq('id', orderId)
      .select()
      .single();

    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  return data;
}

export async function markPaymentStatus(orderId, paymentStatus) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const payload = {
    payment_status: paymentStatus,
    transaction_ref: paymentStatus === 'paid' ? `MANUAL-${orderId}-${Date.now()}` : null,
  };

  let { error } = await supabase
    .from('orders')
    .update(payload)
    .eq('id', orderId);

  if (isMissingTransactionRefError(error)) {
    const fallback = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', orderId);

    error = fallback.error;
  }

  if (error) throw error;
}

function isMissingTransactionRefError(error) {
  return error?.code === '42703' && error?.message?.includes('transaction_ref');
}

export default {
  processPayment,
  markPaymentStatus,
};
