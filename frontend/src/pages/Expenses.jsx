import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { X, Upload, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../api/axiosConfig';

export default function Expenses({ isDark, toggleTheme }) {
  const navigate = useNavigate();
  const toMonthStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const formatMonth = (m) => new Date(m + '-01T00:00:00').toLocaleString('default', { month: 'long', year: 'numeric' });

  const [listMonth, setListMonth] = useState(toMonthStr(new Date()));
  const [expenses, setExpenses] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  // "account" = paid from a linked bank account (date locked to today, pick
  // an account instead of a category). "category" = the original flow
  // (pick a date, then a budget category for that month).
  const [payFrom, setPayFrom] = useState('category');
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState('');
  const [fetchingAccounts, setFetchingAccounts] = useState(false);

  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [fetchingExpenses, setFetchingExpenses] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);
  const [saveSlowNotice, setSaveSlowNotice] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/');
  }, [navigate]);

  // Loads only the categories that have a budget for the given month
  // (e.g. "2026-08") — matching the month of whatever date is picked below,
  // not every category you've ever budgeted for.
  const fetchCategoriesForMonth = async (monthStr) => {
    try {
      const response = await API.get(`/budgets/?month=${monthStr}`);
      const cats = response.data.map((b) => b.category);
      setBudgetCategories(cats);
      setCategory((prev) => (prev && cats.includes(prev)) ? prev : (cats[0] || ''));
    } catch (error) {
      console.error("Failed to fetch categories", error);
      setBudgetCategories([]);
    }
  };

  const fetchAccounts = async () => {
    setFetchingAccounts(true);
    try {
      const response = await API.get('/accounts/');
      setAccounts(response.data);
      setAccountId((prev) => (prev && response.data.some(a => a.id === prev)) ? prev : (response.data[0]?.id || ''));
    } catch (error) {
      console.error("Failed to fetch accounts", error);
      setAccounts([]);
    } finally {
      setFetchingAccounts(false);
    }
  };

  const fetchExpenses = async () => {
    setFetchingExpenses(true);
    setSlowNotice(false);
    // Free-tier backends spin down when idle — the first request after a
    // while can take 30-60s to "wake up". Flag it after a few seconds so
    // an empty table doesn't read as broken.
    const slowTimer = setTimeout(() => setSlowNotice(true), 4000);
    try {
      const response = await API.get(`/expenses/?month=${listMonth}`);
      setExpenses(response.data);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
    } finally {
      clearTimeout(slowTimer);
      setFetchingExpenses(false);
      setSlowNotice(false);
      setHasLoadedOnce(true);
    }
  };

  const changeListMonth = (direction) => {
    const [y, m] = listMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + direction, 1);
    setListMonth(toMonthStr(d));
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await API.delete('/expenses/clear-all');
      setExpenses([]);
      setConfirmingClear(false);
    } catch (error) {
      console.error("Failed to clear expenses", error);
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [listMonth]);

  // Re-fetch the category list every time the selected date's month changes —
  // this is what keeps the dropdown scoped to "budgets that exist for the
  // month you're logging this expense in", not every budget you've ever made.
  useEffect(() => {
    if (payFrom === 'category' && date) fetchCategoriesForMonth(date.slice(0, 7));
  }, [date, payFrom]);

  // Bank Account flow: load the account list once you switch to it.
  useEffect(() => {
    if (payFrom === 'account' && isOpen) fetchAccounts();
  }, [payFrom, isOpen]);

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSaveSlowNotice(false);
    const today = new Date().toISOString().slice(0, 10);
    const effectiveDate = payFrom === 'account' ? today : date;

    if (payFrom === 'account') {
      if (!amount || !description || !accountId) {
        setErrorMsg('Please fill in all fields.');
        return;
      }
    } else if (!amount || !date || !description || !category) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setLoading(true);
    // Free-tier backends spin down when idle — the first request after a
    // while can take 30-60s to wake up. Flag it after a few seconds instead
    // of leaving the button looking stuck.
    const slowTimer = setTimeout(() => setSaveSlowNotice(true), 4000);

    const savedMonth = effectiveDate.slice(0, 7);
    const payload = payFrom === 'account'
      ? { amount: parseFloat(amount), description, expense_date: effectiveDate, account_id: accountId }
      : { amount: parseFloat(amount), description, expense_date: effectiveDate, category };

    const attemptSave = async (isRetry = false) => {
      try {
        await API.post('/expenses/', payload);
        setIsOpen(false);
        resetForm();
        // Jump the list to whatever month this expense was logged in, so
        // it's visible immediately even if you were viewing a different one.
        if (savedMonth === listMonth) fetchExpenses();
        else setListMonth(savedMonth);
      } catch (error) {
        console.error("Failed to save expense.", error);
        // A pure network failure (no response at all) during a cold start is
        // usually transient — the server was mid-wake-up. Try once more
        // automatically before bothering the user with an error.
        if (!isRetry && error.request && !error.response) {
          await attemptSave(true);
          return;
        }
        if (error.response) {
          const detail = error.response.data?.detail;
          setErrorMsg(
            typeof detail === 'string' ? detail :
            Array.isArray(detail) ? detail.map(d => d.msg).join(', ') :
            `Failed to save (status ${error.response.status}).`
          );
        } else if (error.request) {
          setErrorMsg('Still no response from the server after retrying. It may still be waking up — wait a few seconds and try again.');
        } else {
          setErrorMsg('Something went wrong while saving.');
        }
      }
    };

    await attemptSave();
    clearTimeout(slowTimer);
    setSaveSlowNotice(false);
    setLoading(false);
  };

  const resetForm = () => {
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setErrorMsg('');
    setPayFrom('category');
    setAccountId('');
    if (budgetCategories.length > 0) setCategory(budgetCategories[0]);
    else setCategory('');
  };

  return (
    <div className={`flex min-h-screen transition-colors ${isDark ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-black'}`}>
      <Sidebar isDark={isDark} toggleTheme={toggleTheme} />
      <main className="flex-1 p-8 relative overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Expenses</h1>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#12121a] border-gray-800 text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}>
              <ChevronLeft size={16} className="cursor-pointer hover:text-blue-400" onClick={() => changeListMonth(-1)} />
              <span className="min-w-[140px] text-center">{formatMonth(listMonth)}</span>
              <ChevronRight size={16} className="cursor-pointer hover:text-blue-400" onClick={() => changeListMonth(1)} />
            </div>
            {confirmingClear ? (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-400">Delete ALL expenses (every month)?</span>
                <button onClick={() => setConfirmingClear(false)} disabled={clearing} className="px-3 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors disabled:opacity-50">Cancel</button>
                <button onClick={handleClearAll} disabled={clearing} className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center gap-2">
                  {clearing && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {clearing ? 'Deleting...' : 'Yes, delete all'}
                </button>
              </div>
            ) : (
              expenses.length > 0 && (
                <button onClick={() => setConfirmingClear(true)} className="px-3 py-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 text-sm transition-colors">
                  Clear All
                </button>
              )
            )}
            <button onClick={() => setIsOpen(true)} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus size={18} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <table className="w-full text-sm text-left">
            <thead className={`text-xs text-gray-400 uppercase border-b ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'}`}>
              <tr>
                <th className="px-6 py-4">Transaction</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {!hasLoadedOnce && fetchingExpenses ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {slowNotice && (
                        <span className="text-xs max-w-xs">
                          Still loading — the server can take up to a minute to wake up on its first request.
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No expenses found for {formatMonth(listMonth)}.</td></tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className={`border-b transition-colors ${isDark ? 'border-gray-800 hover:bg-[#1e1e2e]' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className="px-6 py-4 font-medium">{exp.description}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {exp.category ? exp.category : (
                        <span className="inline-flex items-center gap-1 text-blue-400">
                          🏦 {exp.account_name || 'Bank Account'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400">{exp.expense_date}</td>
                    <td className="px-6 py-4 font-medium text-red-400">- ${exp.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-500/10 text-green-400 text-xs px-2 py-1 rounded-full">Completed</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-[100]">
            <div className={`w-full max-w-md p-6 rounded-xl border space-y-6 ${isDark ? 'bg-[#12121a] border-gray-700' : 'bg-white border-gray-300'}`}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Add Expense</h2>
                <button onClick={() => { setIsOpen(false); resetForm(); }} disabled={loading}><X size={24} className="text-gray-400 hover:text-white" /></button>
              </div>

              <form onSubmit={handleSave}>
                <div className="text-center p-6 bg-[#1e1e2e] rounded-lg border border-gray-700 mb-6">
                  <p className="text-gray-400 text-sm">AMOUNT</p>
                  <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-transparent text-4xl font-bold mt-1 w-full text-center outline-none text-white placeholder-gray-600" placeholder="0.00" required />
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-gray-400 mb-2">PAY FROM</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayFrom('account')}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${payFrom === 'account' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-[#1e1e2e] border-gray-700 text-gray-400 hover:text-white'}`}
                    >
                      Bank Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayFrom('category')}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${payFrom === 'category' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-[#1e1e2e] border-gray-700 text-gray-400 hover:text-white'}`}
                    >
                      Others
                    </button>
                  </div>
                </div>

                {payFrom === 'account' ? (
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-2">ACCOUNT</label>
                    {fetchingAccounts ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 px-3 py-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Loading accounts...
                      </div>
                    ) : accounts.length > 0 ? (
                      <select value={accountId} onChange={(e) => setAccountId(Number(e.target.value))} className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark]" required>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>{acc.name} • {acc.bank} (${acc.balance.toFixed(2)})</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-500 px-3 py-2 border border-gray-700 rounded-lg bg-[#1e1e2e]">
                        No accounts yet — add one on the Accounts page first.
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Dated today ({new Date().toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' })}) — the amount will be deducted from this account's balance.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">DATE</label>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark]" required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">CATEGORY</label>
                      <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark]" required>
                        {budgetCategories.length > 0 ? (
                          budgetCategories.map((cat, index) => (<option key={index} value={cat}>{cat}</option>))
                        ) : (
                          <option value="" disabled>No budgets set for this month</option>
                        )}
                      </select>
                      {date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Showing budgets for {new Date(date + 'T00:00:00').toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-xs text-gray-400 mb-2">DESCRIPTION</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this for?" className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" required />
                </div>

                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-gray-500 transition-colors mb-6">
                  <Upload size={24} className="mb-2" />
                  <p className="text-sm">Upload receipt <span className="text-xs text-gray-600">(Optional)</span></p>
                </div>

                {errorMsg && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">{errorMsg}</p>
                )}
                {saveSlowNotice && (
                  <p className="text-xs text-gray-500 text-center mb-4">
                    Still working — the server can take up to a minute to wake up on its first request.
                  </p>
                )}

                <div className="flex space-x-4">
                  <button type="button" onClick={() => { setIsOpen(false); resetForm(); }} disabled={loading} className="flex-1 py-3 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">Cancel</button>

                  <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save Expense"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}