import React from 'react';
import Sidebar from '../components/Sidebar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

const spendData = [
  { name: 'Food & Dining', amount: 850, limit: 1000 },
  { name: 'Transportation', amount: 620, limit: 500 },
  { name: 'Entertainment', amount: 200, limit: 300 },
];

const comparisonData = [
  { month: 'Jan', expenses: 4000 },
  { month: 'Feb', expenses: 3000 },
  { month: 'Mar', expenses: 5000 },
  { month: 'Apr', expenses: 4500 },
  { month: 'May', expenses: 3800 },
  { month: 'Jun', expenses: 4280 },
];

const recentExpenses = [
  { name: 'Whole Foods Market', category: 'Groceries', amount: -84.50, date: 'Jun 12' },
  { name: 'Uber Trip', category: 'Transport', amount: -24.00, date: 'Jun 11' },
  { name: 'Netflix Subscription', category: 'Entertainment', amount: -15.99, date: 'Jun 10' },
];

export default function Dashboard({ isDark, toggleTheme }) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: isDark ? '#0a0a0f' : '#f3f4f6', color: isDark ? 'white' : 'black' }}>
      <Sidebar isDark={isDark} toggleTheme={toggleTheme} />
      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-500 text-sm">Welcome back, Analyst</p>
          </div>
          <div className={`text-sm px-4 py-2 rounded-lg border ${isDark ? 'text-gray-400 bg-[#12121a] border-gray-800' : 'text-gray-600 bg-white border-gray-200'}`}>
            June 2024 Financial Cycle
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-xl border ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <p className="text-gray-400 text-sm">Total Spent</p>
            <h2 className="text-3xl font-bold mt-2">$4,280.50</h2>
            <div className="flex items-center mt-2 text-sm text-red-400">
              <TrendingUp size={16} className="mr-1" /> 12% from last month
            </div>
          </div>
          <div className={`p-6 rounded-xl border ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <p className="text-gray-400 text-sm">Total Budget</p>
            <h2 className="text-3xl font-bold mt-2">$6,000.00</h2>
            <p className="text-gray-500 text-sm mt-2">2024 Fiscal Year</p>
          </div>
          <div className={`p-6 rounded-xl border ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <p className="text-gray-400 text-sm">Remaining</p>
            <h2 className="text-3xl font-bold mt-2 text-green-400">$1,719.50</h2>
            <div className="flex items-center mt-2 text-sm text-green-400">
              <TrendingDown size={16} className="mr-1" /> 28.6% of budget
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-1 p-6 rounded-xl border ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h3 className="font-semibold mb-6">Budget Limits</h3>
            <div className="space-y-6">
              {spendData.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.name}</span>
                    <span className="text-gray-400">${item.amount} / ${item.limit}</span>
                  </div>
                  <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <div className={`h-2 rounded-full ${item.amount > item.limit ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((item.amount / item.limit) * 100, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`lg:col-span-2 p-6 rounded-xl border ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h3 className="font-semibold mb-6">Spend Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e1e2e" : "#e5e7eb"} />
                  <XAxis dataKey="month" stroke="#4b5563" fontSize={12} />
                  <YAxis stroke="#4b5563" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="expenses" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <h3 className="font-semibold mb-6">Recent Expenses</h3>
          <div className="space-y-4">
            {recentExpenses.map((item, index) => (
              <div key={index} className={`flex items-center justify-between py-3 border-b last:border-0 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-blue-400 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>{item.name.charAt(0)}</div>
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-red-400">{item.amount}</p>
                  <p className="text-xs text-gray-500">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}