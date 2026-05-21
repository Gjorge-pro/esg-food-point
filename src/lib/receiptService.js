export function calculateReceiptTotal(order) {
  return (order.order_items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.menu_items?.price || 0),
    0,
  );
}

export function buildReceiptHtml(order) {
  const total = calculateReceiptTotal(order);
  const rows = (order.order_items || [])
    .map((item) => {
      const price = Number(item.menu_items?.price || 0);
      const quantity = Number(item.quantity || 0);
      return `
        <tr>
          <td>${item.menu_items?.name || 'Item'}</td>
          <td>${quantity}</td>
          <td>${price.toLocaleString()} TSH</td>
          <td>${(price * quantity).toLocaleString()} TSH</td>
        </tr>
      `;
    })
    .join('');

  return `
    <!doctype html>
    <html>
      <head>
        <title>Receipt #${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
          .receipt { max-width: 420px; margin: 0 auto; }
          h1 { font-size: 22px; margin: 0 0 4px; }
          .muted { color: #666; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th, td { border-bottom: 1px solid #ddd; padding: 8px 4px; text-align: left; font-size: 12px; }
          th:last-child, td:last-child { text-align: right; }
          .total { display: flex; justify-content: space-between; margin-top: 18px; font-weight: 700; font-size: 18px; }
          .footer { margin-top: 24px; text-align: center; font-size: 12px; color: #666; }
          @media print { button { display: none; } body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <h1>ESG FOODPOINT</h1>
          <div class="muted">Receipt #${order.id}</div>
          <div class="muted">${new Date(order.created_at || Date.now()).toLocaleString()}</div>
          <div class="muted">Payment: ${(order.payment_method || 'cash').replace('_', ' ')} (${order.payment_status || 'pending'})</div>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="total"><span>Total</span><span>${total.toLocaleString()} TSH</span></div>
          <div class="footer">Thank you for dining with us.</div>
          <button onclick="window.print()">Print Receipt</button>
        </div>
      </body>
    </html>
  `;
}

export function printReceipt(order) {
  const receiptWindow = window.open('', '_blank', 'width=520,height=720');
  if (!receiptWindow) return;

  receiptWindow.document.open();
  receiptWindow.document.write(buildReceiptHtml(order));
  receiptWindow.document.close();
  receiptWindow.focus();
}

export default {
  calculateReceiptTotal,
  buildReceiptHtml,
  printReceipt,
};
