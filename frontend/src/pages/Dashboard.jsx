import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import API from '../api/axiosConfig';

function ChartTooltip({ active, payload, label, isDark }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className={`px-4 py-3 rounded-lg border shadow-xl ${
        isDark ? 'bg-[#1a1a24] border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
      }`}
    >
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold">
        ${payload[0].value.toFixed(2)}
      </p>
    </div>
  );
}

export default function Dashboard({ isDark, toggleTheme }) {
  const navigate = useNavigate();
  const now = new Date();
  const toMonthStr = (dateObj) => `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
  const currentMonth = toMonthStr(now);

  const [summary, setSummary] = useState({ total_expenses: 0, total_budget: 0 });
  const [budgets, setBudgets] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/');
  }, [navigate]);

  const monthLabel = (dateObj) => dateObj.toLocaleString('default', { month: 'short' });
  const monthStr = toMonthStr;

  const fetchDashboard = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [summaryRes, budgetsRes, expensesRes] = await Promise.all([
        API.get(`/dashboard/monthly-summary?month=${currentMonth}`),
        API.get(`/budgets/?month=${currentMonth}`),
        API.get('/expenses/'),
      ]);

      setSummary(summaryRes.data);
      setBudgets(budgetsRes.data);
      setRecentExpenses(expensesRes.data.slice(0, 5));

      // Anchor the window to "today", or the latest expense's month if it's further out
      // (expenses come back ordered by expense_date desc, so [0] is the most recent/future one)
      let anchorDate = now;
      if (expensesRes.data.length > 0) {
        const latestExpenseDate = new Date(`${expensesRes.data[0].expense_date}T00:00:00`);
        if (latestExpenseDate > anchorDate) {
          anchorDate = latestExpenseDate;
        }
      }

      // Build last 6 months of spend for the comparison chart
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - i, 1);
        months.push(d);
      }
      const monthlyTotals = await Promise.all(
        months.map(async (d) => {
          try {
            const res = await API.get(`/dashboard/monthly-summary?month=${monthStr(d)}`);
            return { month: monthLabel(d), expenses: res.data.total_expenses };
          } catch {
            return { month: monthLabel(d), expenses: 0 };
          }
        })
      );
      setComparisonData(monthlyTotals);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const remaining = summary.total_budget - summary.total_expenses;
  const percentUsed = summary.total_budget > 0 ? ((summary.total_expenses / summary.total_budget) * 100).toFixed(1) : 0;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: isDark ? '#0a0a0f' : '#f3f4f6', color: isDark ? 'white' : 'black' }}>
      <Sidebar isDark={isDark} toggleTheme={toggleTheme} />
      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-500 text-sm">Welcome back</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`text-sm px-4 py-2 rounded-lg border ${isDark ? 'text-gray-400 bg-[#12121a] border-gray-800' : 'text-gray-600 bg-white border-gray-200'}`}>
              {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              title="Refresh"
              className={`px-3 py-2 rounded-lg border text-sm transition-colors disabled:opacity-50 ${isDark ? 'bg-[#12121a] border-gray-800 text-gray-300 hover:text-white' : 'bg-white border-gray-300 text-gray-700 hover:text-black'}`}
            >
              {refreshing ? '…' : '⟳'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-xl border ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                <p className="text-gray-400 text-sm">Total Spent</p>
                <h2 className="text-3xl font-bold mt-2">${summary.total_expenses.toFixed(2)}</h2>
                <div className="flex items-center mt-2 text-sm text-red-400">
                  <TrendingUp size={16} className="mr-1" /> {percentUsed}% of budget used
                </div>
              </div>
              <div className={`p-6 rounded-xl border ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                <p className="text-gray-400 text-sm">Total Budget</p>
                <h2 className="text-3xl font-bold mt-2">${summary.total_budget.toFixed(2)}</h2>
                <p className="text-gray-500 text-sm mt-2">{now.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
              </div>
              <div className={`p-6 rounded-xl border ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                <p className="text-gray-400 text-sm">Remaining</p>
                <h2 className={`text-3xl font-bold mt-2 ${remaining < 0 ? 'text-red-400' : 'text-green-400'}`}>${remaining.toFixed(2)}</h2>
                <div className={`flex items-center mt-2 text-sm ${remaining < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  <TrendingDown size={16} className="mr-1" /> {remaining < 0 ? 'Over budget' : `${(100 - percentUsed).toFixed(1)}% left`}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`lg:col-span-1 p-6 rounded-xl border ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className="font-semibold mb-6">Budget Limits</h3>
                {budgets.length === 0 ? (
                  <p className="text-sm text-gray-500">No budgets set for this month.</p>
                ) : (
                  <div className="space-y-6">
                    {budgets.map((item) => (
                      <div key={item.id}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.category}</span>
                          <span className="text-gray-400">${item.used_amount.toFixed(2)} / ${item.budget_amount.toFixed(2)}</span>
                        </div>
                        <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                          <div className={`h-2 rounded-full ${item.used_amount > item.budget_amount ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(item.percentage_consumed, 100)}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`lg:col-span-2 p-6 rounded-xl border ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className="font-semibold mb-6">Spend Comparison (Last 6 Months)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7} />
                        </linearGradient>
                        <linearGradient id="barFillActive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a78bfa" stopOpacity={1} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.85} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="0"
                        vertical={false}
                        stroke={isDark ? '#1e1e2e' : '#f0f1f3'}
                      />
                      <XAxis
                        dataKey="month"
                        stroke="transparent"
                        tick={{ fill: isDark ? '#6b7280' : '#9ca3af', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="transparent"
                        tick={{ fill: isDark ? '#6b7280' : '#9ca3af', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${v}`}
                        width={56}
                      />
                      <Tooltip
                        content={<ChartTooltip isDark={isDark} />}
                        cursor={false}
                      />
                      <Bar dataKey="expenses" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {comparisonData.map((entry, index) => (
                          <Cell
                            key={entry.month}
                            fill={index === comparisonData.length - 1 ? 'url(#barFillActive)' : 'url(#barFill)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-xl border ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h3 className="font-semibold mb-6">Recent Expenses</h3>
              {recentExpenses.length === 0 ? (
                <p className="text-sm text-gray-500">No expenses recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {recentExpenses.map((item) => (
                    <div key={item.id} className={`flex items-center justify-between py-3 border-b last:border-0 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-blue-400 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>{item.category.charAt(0)}</div>
                        <div>
                          <p className="font-medium text-sm">{item.description}</p>
                          <p className="text-xs text-gray-500">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-400">-${item.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{item.expense_date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}