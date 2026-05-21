import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useFinance } from '../../hooks/useFinance';
import { currency } from '../../lib/formatters';
import { useToast } from '../../components/Toast';

export function FinancePanel() {
  const { addToast } = useToast();
  const { income, expenses, totalIncome, totalExpenses, profit, addIncome, addExpense, deleteIncome, deleteExpense } = useFinance();
  const [activeTab, setActiveTab] = useState('income');
  const [incomeForm, setIncomeForm] = useState({
    source: 'order',
    amount: '',
    payment_method: 'cash'
  });
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'supplies'
  });
  const inputClassName = 'w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500';

  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!incomeForm.amount) return;
    const result = await addIncome(incomeForm);
    if (result.success) {
      setIncomeForm({ source: 'order', amount: '', payment_method: 'cash' });
      addToast('✅ Income recorded', 'success');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) return;
    const result = await addExpense(expenseForm);
    if (result.success) {
      setExpenseForm({ description: '', amount: '', category: 'supplies' });
      addToast('✅ Expense recorded', 'success');
    }
  };

  const handleDeleteIncome = async (id) => {
    const result = await deleteIncome(id);
    if (result.success) addToast('✅ Deleted', 'success');
  };

  const handleDeleteExpense = async (id) => {
    const result = await deleteExpense(id);
    if (result.success) addToast('✅ Deleted', 'success');
  };

  const profitColor = profit >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300';

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Finance</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded border-2 border-green-300 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300">Income</p>
          <p className="text-xl font-bold text-green-900 dark:text-green-100">{currency(totalIncome)}</p>
        </div>
        <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded border-2 border-red-300 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-300">Expenses</p>
          <p className="text-xl font-bold text-red-900 dark:text-red-100">{currency(totalExpenses)}</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded border-2 border-blue-300 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">Profit</p>
          <p className={`text-xl font-bold ${profitColor}`}>{currency(profit)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('income')}
          className={`px-4 py-2 rounded ${
            activeTab === 'income'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200'
          }`}
        >
          Income
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded ${
            activeTab === 'expenses'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200'
          }`}
        >
          Expenses
        </button>
      </div>

      {/* Income Tab */}
      {activeTab === 'income' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold mb-3 text-gray-900 dark:text-gray-100">Add Income</h3>
            <form onSubmit={handleAddIncome} className="space-y-2">
              <select
                value={incomeForm.source}
                onChange={(e) => setIncomeForm({...incomeForm, source: e.target.value})}
                className={inputClassName}
              >
                <option value="order">Order</option>
                <option value="other">Other</option>
              </select>
              <input
                type="number"
                placeholder="Amount"
                step="0.01"
                value={incomeForm.amount}
                onChange={(e) => setIncomeForm({...incomeForm, amount: e.target.value})}
                className={inputClassName}
                required
              />
              <select
                value={incomeForm.payment_method}
                onChange={(e) => setIncomeForm({...incomeForm, payment_method: e.target.value})}
                className={inputClassName}
              >
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="card">Card</option>
              </select>
              <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                <Plus size={16} className="inline mr-2" />
                Add Income
              </button>
            </form>
          </div>

          <div className="space-y-2">
            {income.length === 0 ? (
              <p className="py-8 text-center text-gray-600 dark:text-gray-400">No income recorded today</p>
            ) : (
              income.map(inc => (
                <div key={inc.id} className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 flex justify-between">
                  <div>
                    <p className="font-semibold text-green-600 dark:text-green-400">{currency(inc.amount)}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{inc.source} • {inc.payment_method}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteIncome(inc.id)}
                    className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold mb-3 text-gray-900 dark:text-gray-100">Add Expense</h3>
            <form onSubmit={handleAddExpense} className="space-y-2">
              <input
                type="text"
                placeholder="Description"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
              <input
                type="number"
                placeholder="Amount"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              >
                <option value="supplies">Supplies</option>
                <option value="utilities">Utilities</option>
                <option value="staff">Staff</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Other</option>
              </select>
              <button type="submit" className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                <Plus size={16} className="inline mr-2" />
                Add Expense
              </button>
            </form>
          </div>

          <div className="space-y-2">
            {expenses.length === 0 ? (
              <p className="py-8 text-center text-gray-600 dark:text-gray-400">No expenses recorded today</p>
            ) : (
              expenses.map(exp => (
                <div key={exp.id} className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 flex justify-between">
                  <div>
                    <p className="font-semibold text-red-600 dark:text-red-400">-{currency(exp.amount)}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{exp.description} • {exp.category}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
