import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { RefreshCw } from 'lucide-react';

export default function Accounts({ isDark, toggleTheme }) {
  const navigate = useNavigate();
  const [accountsList, setAccountsList] = useState([
    { id: 1, name: 'Main Checking', bank: 'Chase Bank', type: 'Checking', balance: 12450.82, status: 'Syncing', color: 'bg-blue-600 text-white' },
    { id: 2, name: 'Premium Savings', bank: 'Ally Financial', type: 'Savings', balance: 45000.00, status: 'Updated', color: 'bg-purple-600 text-white' },
    { id: 3, name: 'Sapphire Reserve', bank: 'Chase Bank', type: 'Credit', balance: -2142.15, status: 'Updated', color: 'bg-slate-800 text-yellow-500 border border-yellow-500/30' },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAccountsList(prev => prev.map(acc => acc.status === 'Syncing' ? { ...acc, status: 'Updated' } : acc));
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { if (!localStorage.getItem('token')) navigate('/'); }, [navigate]);

  return (
    <div className="flex min-h-screen">
      <Sidebar isDark={isDark} toggleTheme={toggleTheme} />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your connected financial institutions</p>
        </div>

        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg">Connected Accounts</h3>
            <p className="text-sm text-gray-500">{accountsList.length} Active Financial Institutions • Last synced 2 mins ago</p>
          </div>

          <div className="space-y-4">
            {accountsList.map((acc) => (
              <div key={acc.id} className={`p-5 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center transition-colors ${isDark ? 'bg-[#12121a] border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm ${acc.color}`}>{acc.bank.substring(0, 2).toUpperCase()}</div>
                  <div>
                    <h3 className="font-semibold">{acc.name}</h3>
                    <p className="text-sm text-gray-500">{acc.bank} • {acc.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <p className={`text-xl font-bold ${acc.balance < 0 ? 'text-red-400' : 'text-white'}`}>{acc.balance < 0 ? '-' : ''}${Math.abs(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${acc.status === 'Syncing' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'}`}>
                    {acc.status === 'Syncing' && <RefreshCw size={12} className="animate-spin" />}
                    <span>{acc.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-gray-600">Your data is secured with 256-bit encryption • <span className="text-blue-500 cursor-pointer hover:underline">Read our privacy policy</span></p>
        </div>
      </main>
    </div>
  );
}