import { useEffect, useState } from 'react';
import { ClipboardCheck, PackageCheck, RefreshCw, RotateCcw, Trash2, WalletCards } from 'lucide-react';
import { Panel } from '../../components/Panel';
import { useAuth } from '../../contexts/AuthContext';
import { useDailyOperations } from '../../hooks/useDailyOperations';
import { currency } from '../../lib/formatters';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

const inputClassName = 'w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] dark:bg-gray-800';

export function DailyOperationsPanel({ mode = 'staff' }) {
  const auth = useAuth();
  const operations = useDailyOperations(auth);
  const [menuItems, setMenuItems] = useState([]);
  const [openingForm, setOpeningForm] = useState({ item_name: '', quantity: '' });
  const [closingForm, setClosingForm] = useState({ item_name: '', quantity: '' });
  const [wasteForm, setWasteForm] = useState({ menu_item_id: '', quantity: '', note: '' });
  const [leftoverForm, setLeftoverForm] = useState({ menu_item_id: '', quantity: '', note: '' });
  const [debtForm, setDebtForm] = useState({
    supplier_name: '',
    item_supplied: '',
    total_amount: '',
    paid_amount: '',
    due_date: '',
    notes: '',
  });
  const [sessionForm, setSessionForm] = useState({ cashOpening: '', cashClosing: '', openingNotes: '', closingNotes: '' });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase
      .from('menu_items')
      .select('id, name, price')
      .order('name')
      .then(({ data }) => setMenuItems(data || []));
  }, []);

  const snapshot = operations.snapshot;
  const status = snapshot.session?.status || 'opening';
  const isReadOnly = mode === 'admin';

  const handleOpeningSubmit = async (event) => {
    event.preventDefault();
    const result = await operations.recordOpeningStock(openingForm);
    if (result.success) setOpeningForm({ item_name: '', quantity: '' });
  };

  const handleClosingSubmit = async (event) => {
    event.preventDefault();
    const result = await operations.recordClosingStock(closingForm);
    if (result.success) setClosingForm({ item_name: '', quantity: '' });
  };

  const handleMovementSubmit = async (event, type) => {
    event.preventDefault();
    const action = type === 'waste' ? operations.recordWaste : operations.recordLeftover;
    const form = type === 'waste' ? wasteForm : leftoverForm;
    const result = await action(form);
    if (result.success && type === 'waste') setWasteForm({ menu_item_id: '', quantity: '', note: '' });
    if (result.success && type === 'leftover') setLeftoverForm({ menu_item_id: '', quantity: '', note: '' });
  };

  const handleDebtSubmit = async (event) => {
    event.preventDefault();
    const result = await operations.createSupplierDebt(debtForm);
    if (result.success) {
      setDebtForm({ supplier_name: '', item_supplied: '', total_amount: '', paid_amount: '', due_date: '', notes: '' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Daily Operations</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Opening, active service, closing, waste, leftovers, and supplier debt tied to one daily session.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={operations.businessDate}
            onChange={(event) => operations.setBusinessDate(event.target.value)}
            className={inputClassName}
          />
          <button
            type="button"
            onClick={() => operations.loadSnapshot().catch(() => {})}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {operations.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {operations.error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Session" value={status.replace('_', ' ')} />
        <MetricCard label="Orders" value={snapshot.metrics.totalOrders} />
        <MetricCard label="Revenue" value={currency(snapshot.metrics.revenue)} />
        <MetricCard label="Operating Profit" value={currency(snapshot.metrics.operatingProfit)} />
        <MetricCard label="Completion" value={`${snapshot.metrics.serviceCompletionRate}%`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Opening Items" value={snapshot.metrics.openingItems} />
        <MetricCard label="Closing Items" value={snapshot.metrics.closingItems} />
        <MetricCard label="Waste Qty" value={snapshot.metrics.wasteQuantity} />
        <MetricCard label="Leftover Qty" value={snapshot.metrics.leftoverQuantity} />
      </div>

      {!isReadOnly ? (
        <Panel title="Session Workflow" subtitle="Move the day from opening to active service and then closed.">
          <div className="grid gap-4 lg:grid-cols-3">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                operations.openDay({ notes: sessionForm.openingNotes, cashOpening: sessionForm.cashOpening });
              }}
              className="space-y-3"
            >
              <input
                type="number"
                step="0.01"
                placeholder="Opening cash"
                value={sessionForm.cashOpening}
                onChange={(event) => setSessionForm((current) => ({ ...current, cashOpening: event.target.value }))}
                className={inputClassName}
              />
              <textarea
                placeholder="Opening notes"
                value={sessionForm.openingNotes}
                onChange={(event) => setSessionForm((current) => ({ ...current, openingNotes: event.target.value }))}
                className={inputClassName}
              />
              <button type="submit" disabled={operations.saving} className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                Open Day
              </button>
            </form>

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => operations.startClosing()}
                disabled={operations.saving || status === 'closed'}
                className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Start Closing
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                operations.closeDay({ notes: sessionForm.closingNotes, cashClosing: sessionForm.cashClosing });
              }}
              className="space-y-3"
            >
              <input
                type="number"
                step="0.01"
                placeholder="Closing cash"
                value={sessionForm.cashClosing}
                onChange={(event) => setSessionForm((current) => ({ ...current, cashClosing: event.target.value }))}
                className={inputClassName}
              />
              <textarea
                placeholder="Closing notes"
                value={sessionForm.closingNotes}
                onChange={(event) => setSessionForm((current) => ({ ...current, closingNotes: event.target.value }))}
                className={inputClassName}
              />
              <button type="submit" disabled={operations.saving} className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
                Close Day
              </button>
            </form>
          </div>
        </Panel>
      ) : null}

      {!isReadOnly ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Opening Stock" subtitle="Start-of-day stock count for operational reporting.">
            <StockForm form={openingForm} setForm={setOpeningForm} onSubmit={handleOpeningSubmit} buttonLabel="Record Opening" />
          </Panel>
          <Panel title="Closing Stock" subtitle="End-of-day stock count used by variance and waste review.">
            <StockForm form={closingForm} setForm={setClosingForm} onSubmit={handleClosingSubmit} buttonLabel="Record Closing" />
          </Panel>
        </div>
      ) : null}

      {!isReadOnly ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <Panel title="Waste" subtitle="Records inventory movement with movement type waste.">
            <MovementForm
              icon={<Trash2 size={16} />}
              form={wasteForm}
              setForm={setWasteForm}
              menuItems={menuItems}
              onSubmit={(event) => handleMovementSubmit(event, 'waste')}
              buttonLabel="Record Waste"
            />
          </Panel>
          <Panel title="Leftovers" subtitle="Returns usable leftovers through the existing inventory movement flow.">
            <MovementForm
              icon={<RotateCcw size={16} />}
              form={leftoverForm}
              setForm={setLeftoverForm}
              menuItems={menuItems}
              onSubmit={(event) => handleMovementSubmit(event, 'leftover')}
              buttonLabel="Record Leftover"
            />
          </Panel>
          <Panel title="Supplier Debt" subtitle="Track unpaid supplier obligations without changing finance logic.">
            <DebtForm form={debtForm} setForm={setDebtForm} onSubmit={handleDebtSubmit} />
          </Panel>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <RecordList title="Recent Waste" icon={<Trash2 size={16} />} items={snapshot.waste} />
        <RecordList title="Recent Leftovers" icon={<RotateCcw size={16} />} items={snapshot.leftovers} />
        <DebtList debts={snapshot.debts} />
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">{label}</p>
      <p className="mt-2 text-xl font-bold capitalize text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function StockForm({ form, setForm, onSubmit, buttonLabel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="Item name"
        value={form.item_name}
        onChange={(event) => setForm((current) => ({ ...current, item_name: event.target.value }))}
        className={inputClassName}
        required
      />
      <input
        type="number"
        min="0"
        placeholder="Quantity"
        value={form.quantity}
        onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
        className={inputClassName}
        required
      />
      <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">
        <PackageCheck size={16} />
        {buttonLabel}
      </button>
    </form>
  );
}

function MovementForm({ icon, form, setForm, menuItems, onSubmit, buttonLabel }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <select
        value={form.menu_item_id}
        onChange={(event) => setForm((current) => ({ ...current, menu_item_id: event.target.value }))}
        className={inputClassName}
        required
      >
        <option value="">Select menu item</option>
        {menuItems.map((item) => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="Quantity"
        value={form.quantity}
        onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
        className={inputClassName}
        required
      />
      <input
        type="text"
        placeholder="Note"
        value={form.note}
        onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
        className={inputClassName}
      />
      <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">
        {icon}
        {buttonLabel}
      </button>
    </form>
  );
}

function DebtForm({ form, setForm, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="text" placeholder="Supplier name" value={form.supplier_name} onChange={(event) => setForm((current) => ({ ...current, supplier_name: event.target.value }))} className={inputClassName} required />
      <input type="text" placeholder="Item supplied" value={form.item_supplied} onChange={(event) => setForm((current) => ({ ...current, item_supplied: event.target.value }))} className={inputClassName} required />
      <input type="number" min="0" step="0.01" placeholder="Total amount" value={form.total_amount} onChange={(event) => setForm((current) => ({ ...current, total_amount: event.target.value }))} className={inputClassName} required />
      <input type="number" min="0" step="0.01" placeholder="Paid amount" value={form.paid_amount} onChange={(event) => setForm((current) => ({ ...current, paid_amount: event.target.value }))} className={inputClassName} />
      <input type="date" value={form.due_date} onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))} className={inputClassName} />
      <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">
        <WalletCards size={16} />
        Record Debt
      </button>
    </form>
  );
}

function RecordList({ title, icon, items }) {
  return (
    <Panel title={title}>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg bg-[var(--bg-main)] px-3 py-2 text-sm">
            <p className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
              {icon}
              {item.menu_items?.name || `Item #${item.menu_item_id}`}
            </p>
            <p className="text-[var(--text-secondary)]">Qty: {Math.abs(Number(item.quantity_delta || 0))}</p>
            {item.note ? <p className="text-[var(--text-secondary)]">{item.note}</p> : null}
          </div>
        ))}
        {items.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">No records yet.</p> : null}
      </div>
    </Panel>
  );
}

function DebtList({ debts }) {
  return (
    <Panel title="Supplier Debts">
      <div className="space-y-3">
        {debts.map((debt) => (
          <div key={debt.id} className="rounded-lg bg-[var(--bg-main)] px-3 py-2 text-sm">
            <p className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
              <ClipboardCheck size={16} />
              {debt.supplier_name}
            </p>
            <p className="text-[var(--text-secondary)]">{debt.item_supplied}</p>
            <p className="font-semibold text-[var(--text-primary)]">{currency(debt.remaining_balance ?? debt.total_amount)}</p>
          </div>
        ))}
        {debts.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">No supplier debts recorded for this day.</p> : null}
      </div>
    </Panel>
  );
}
