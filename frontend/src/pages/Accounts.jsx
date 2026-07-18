import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';
import API from '../api/axiosConfig';
const ACCOUNT_TYPES = ['Checking', 'Savings', 'Credit', 'Investment', 'Other'];
const TYPE_COLORS = {
    Checking: 'bg-blue-600 text-white',
    Savings: 'bg-purple-600 text-white',
    Credit: 'bg-slate-800 text-yellow-500 border border-yellow-500/30',
    Investment: 'bg-emerald-600 text-white',
    Other: 'bg-gray-600 text-white',
};
function Spinner({ className = 'h-4 w-4' }) {
    return (<svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>);
}
export default function Accounts({ isDark, toggleTheme }) {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [slowNotice, setSlowNotice] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [name, setName] = useState('');
    const [bank, setBank] = useState('');
    const [type, setType] = useState(ACCOUNT_TYPES[0]);
    const [balance, setBalance] = useState('');
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    useEffect(() => { if (!localStorage.getItem('token'))
        navigate('/'); }, [navigate]);
    const fetchAccounts = async () => {
        setFetching(true);
        setSlowNotice(false);
        const slowTimer = setTimeout(() => setSlowNotice(true), 4000);
        try {
            const response = await API.get('/accounts/');
            setAccounts(response.data);
        }
        catch (error) {
            console.error("Failed to fetch accounts", error);
        }
        finally {
            clearTimeout(slowTimer);
            setFetching(false);
            setSlowNotice(false);
            setHasLoadedOnce(true);
        }
    };
    useEffect(() => { fetchAccounts(); }, []);
    const openAddModal = () => {
        setEditingId(null);
        setName('');
        setBank('');
        setType(ACCOUNT_TYPES[0]);
        setBalance('');
        setErrorMsg('');
        setIsOpen(true);
    };
    const openEditModal = (acc) => {
        setEditingId(acc.id);
        setName(acc.name);
        setBank(acc.bank);
        setType(acc.type);
        setBalance(String(acc.balance));
        setErrorMsg('');
        setIsOpen(true);
    };
    const handleSave = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (!name || !bank || !type || balance === '') {
            setErrorMsg('Please fill in all fields.');
            return;
        }
        setSaving(true);
        try {
            const payload = { name, bank, type, balance: parseFloat(balance) };
            if (editingId) {
                await API.put(`/accounts/${editingId}`, payload);
            }
            else {
                await API.post('/accounts/', payload);
            }
            setIsOpen(false);
            fetchAccounts();
        }
        catch (error) {
            console.error("Failed to save account", error);
            const detail = error.response?.data?.detail;
            setErrorMsg(typeof detail === 'string' ? detail :
                Array.isArray(detail) ? detail.map(d => d.msg).join(', ') :
                    'Something went wrong while saving.');
        }
        finally {
            setSaving(false);
        }
    };
    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            await API.delete(`/accounts/${id}`);
            setAccounts((prev) => prev.filter((a) => a.id !== id));
            setConfirmingDeleteId(null);
        }
        catch (error) {
            console.error("Failed to delete account", error);
        }
        finally {
            setDeleting(false);
        }
    };
    const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
    return (<div className={`flex min-h-screen transition-colors ${isDark ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-black'}`}>
      <Sidebar isDark={isDark} toggleTheme={toggleTheme}/>
      <main className="flex-1 p-4 pt-20 sm:p-6 sm:pt-24 lg:p-8 lg:pt-8 overflow-y-auto min-w-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Accounts</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your financial accounts</p>
          </div>
          <button onClick={openAddModal} className="self-start sm:self-auto flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={18}/>
            <span>Add Account</span>
          </button>
        </div>

        <div className="mb-10">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
            <h3 className="font-semibold text-lg">Your Accounts</h3>
            <p className="text-sm text-gray-500">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} • Net worth ${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {!hasLoadedOnce && fetching ? (<div className="flex flex-col items-center justify-center py-20 gap-3">
              <Spinner className="h-8 w-8 text-blue-500"/>
              {slowNotice && (<p className="text-xs text-gray-500 text-center max-w-xs">
                  Still loading — the server can take up to a minute to wake up on its first request.
                </p>)}
            </div>) : accounts.length === 0 ? (<div className={`text-center py-12 rounded-xl border ${isDark ? 'text-gray-500 bg-[#12121a] border-gray-800' : 'text-gray-400 bg-white border-gray-200'}`}>
              No accounts yet — add one to start tracking your balances.
            </div>) : (<div className="space-y-4">
              {accounts.map((acc) => (<div key={acc.id} className={`p-5 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center transition-colors ${isDark ? 'bg-[#12121a] border-gray-800 hover:border-gray-700' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
                  <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm ${TYPE_COLORS[acc.type] || TYPE_COLORS.Other}`}>
                      {acc.bank.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{acc.name}</h3>
                      <p className="text-sm text-gray-500">{acc.bank} • {acc.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
                    <p className={`text-xl font-bold ${acc.balance < 0 ? 'text-red-400' : (isDark ? 'text-white' : 'text-black')}`}>
                      {acc.balance < 0 ? '-' : ''}${Math.abs(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => openEditModal(acc)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors" title="Edit">
                        <Pencil size={16}/>
                      </button>
                      {confirmingDeleteId === acc.id ? (<div className="flex items-center space-x-2 text-xs">
                          <button onClick={() => setConfirmingDeleteId(null)} disabled={deleting} className="px-2 py-1.5 rounded-lg border border-gray-700 hover:bg-gray-800 disabled:opacity-50">Cancel</button>
                          <button onClick={() => handleDelete(acc.id)} disabled={deleting} className="px-2 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-70 flex items-center gap-1.5">
                            {deleting && <Spinner className="h-3 w-3"/>}
                            {deleting ? 'Deleting...' : 'Confirm'}
                          </button>
                        </div>) : (<button onClick={() => setConfirmingDeleteId(acc.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors" title="Delete">
                          <Trash2 size={16}/>
                        </button>)}
                    </div>
                  </div>
                </div>))}
            </div>)}
        </div>

        {isOpen && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-md rounded-xl border p-6 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">{editingId ? 'Edit Account' : 'Add Account'}</h2>
                <button onClick={() => setIsOpen(false)} disabled={saving}>
                  <X size={22} className="text-gray-400 hover:text-white"/>
                </button>
              </div>

              {errorMsg && (<div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
                  {errorMsg}
                </div>)}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">ACCOUNT NAME</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={saving} className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-60" placeholder="e.g. Main Checking" required/>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">BANK / INSTITUTION</label>
                  <input type="text" value={bank} onChange={(e) => setBank(e.target.value)} disabled={saving} className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-60" placeholder="e.g. Chase Bank" required/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">TYPE</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} disabled={saving} className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark] disabled:opacity-60">
                      {ACCOUNT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">BALANCE</label>
                    <input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} disabled={saving} className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-60" placeholder="0.00" required/>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Use a negative number for credit cards or anything you owe.</p>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsOpen(false)} disabled={saving} className="flex-1 py-3 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 py-3 rounded-lg font-medium transition-colors">
                    {saving && <Spinner />}
                    {saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Add Account')}
                  </button>
                </div>
              </form>
            </div>
          </div>)}

        <div className="text-center mt-8">
          <p className="text-xs text-gray-600">Balances are entered manually — this app doesn't connect to real banks.</p>
        </div>
      </main>
    </div>);
}