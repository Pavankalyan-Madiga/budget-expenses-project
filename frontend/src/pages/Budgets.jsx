import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import API from '../api/axiosConfig';
export default function Budgets({ isDark, toggleTheme }) {
    const navigate = useNavigate();
    const toMonthStr = (dateObj) => `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    const currentDate = new Date();
    const [currentMonth, setCurrentMonth] = useState(toMonthStr(currentDate));
    const [budgets, setBudgets] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [fetchErrorMsg, setFetchErrorMsg] = useState('');
    const [fetching, setFetching] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newMonth, setNewMonth] = useState(currentMonth);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [slowNotice, setSlowNotice] = useState(false);
    useEffect(() => { if (!localStorage.getItem('token'))
        navigate('/'); }, [navigate]);
    const fetchBudgets = async () => {
        setFetching(true);
        setFetchErrorMsg('');
        setSlowNotice(false);
        const slowTimer = setTimeout(() => setSlowNotice(true), 4000);
        try {
            const response = await API.get(`/budgets/?month=${currentMonth}`);
            setBudgets(response.data);
        }
        catch (error) {
            console.error(error);
            if (error.response?.status === 401) {
                setFetchErrorMsg('Your session expired. Please log in again.');
                localStorage.removeItem('token');
                navigate('/');
            }
            else if (error.response) {
                setFetchErrorMsg(`Failed to load budgets (status ${error.response.status}).`);
            }
            else if (error.request) {
                setFetchErrorMsg('No response from server — check your connection or the backend URL.');
            }
            else {
                setFetchErrorMsg('Something went wrong while loading budgets.');
            }
        }
        finally {
            clearTimeout(slowTimer);
            setFetching(false);
            setSlowNotice(false);
            setHasLoadedOnce(true);
        }
    };
    useEffect(() => { fetchBudgets(); }, [currentMonth]);
    useEffect(() => { setNewMonth(currentMonth); }, [currentMonth]);
    const handleAddBudget = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        if (!newCategory || !newAmount) {
            setErrorMsg('Please fill in category and amount.');
            return;
        }
        setLoading(true);
        try {
            await API.post('/budgets/', { month: newMonth, category: newCategory, budget_amount: parseFloat(newAmount) });
            setIsModalOpen(false);
            if (newMonth !== currentMonth) {
                setCurrentMonth(newMonth);
            }
            else {
                fetchBudgets();
            }
            resetModal();
        }
        catch (error) {
            console.error(error);
            if (error.response) {
                const detail = error.response.data?.detail;
                setErrorMsg(typeof detail === 'string' ? detail :
                    Array.isArray(detail) ? detail.map(d => d.msg).join(', ') :
                        `Failed to save (status ${error.response.status}).`);
            }
            else if (error.request) {
                setErrorMsg('No response from server — check your connection or the backend URL.');
            }
            else {
                setErrorMsg('Something went wrong while saving.');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const handleDelete = async (id) => {
        try {
            await API.delete(`/budgets/${id}`);
            fetchBudgets();
        }
        catch (error) {
            console.error("Failed to delete", error);
        }
    };
    const resetModal = () => { setNewCategory(''); setNewAmount(''); setErrorMsg(''); };
    const changeMonth = (direction) => {
        const [y, m] = currentMonth.split('-').map(Number);
        const date = new Date(y, m - 1 + direction, 1);
        const str = toMonthStr(date);
        setCurrentMonth(str);
    };
    const formatMonth = (dateStr) => { if (!dateStr)
        return ''; return new Date(dateStr + '-01T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); };
    const totalBudget = budgets.reduce((acc, item) => acc + item.budget_amount, 0);
    const totalSpent = budgets.reduce((acc, item) => acc + item.used_amount, 0);
    return (<div className={`flex min-h-screen transition-colors ${isDark ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-black'}`}>
      <Sidebar isDark={isDark} toggleTheme={toggleTheme}/>
      <main className="flex-1 p-4 pt-20 sm:p-6 sm:pt-24 lg:p-8 lg:pt-8 overflow-y-auto relative min-w-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <h1 className="text-2xl font-bold">Budgets</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#12121a] border-gray-800 text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}>
              <ChevronLeft size={16} className="cursor-pointer hover:text-blue-400" onClick={() => changeMonth(-1)}/>
              <span className="min-w-[110px] sm:min-w-[120px] text-center text-xs sm:text-sm">{formatMonth(currentMonth)}</span>
              <ChevronRight size={16} className="cursor-pointer hover:text-blue-400" onClick={() => changeMonth(1)}/>
            </div>
            <button onClick={fetchBudgets} disabled={fetching} title="Refresh" className={`px-3 py-2 rounded-lg border text-sm transition-colors disabled:opacity-50 ${isDark ? 'bg-[#12121a] border-gray-800 text-gray-300 hover:text-white' : 'bg-white border-gray-300 text-gray-700 hover:text-black'}`}>
              {fetching ? '…' : '⟳'}
            </button>
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Add budget</button>
          </div>
        </div>

        {fetchErrorMsg && (<p className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{fetchErrorMsg}</p>)}

        {!hasLoadedOnce && fetching ? (<div className="flex flex-col items-center justify-center py-24 gap-3">
            <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            {slowNotice && (<p className="text-xs text-gray-500 text-center max-w-xs">
                Still loading — the server can take up to a minute to wake up on its first request.
              </p>)}
          </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.length === 0 ? (<div className={`col-span-3 text-center py-12 rounded-xl border ${isDark ? 'text-gray-500 bg-[#12121a] border-gray-800' : 'text-gray-400 bg-white border-gray-200'}`}>No budgets set.</div>) : (budgets.map((item) => {
                const isOver = item.remaining_amount < 0;
                return (<div key={item.id} className={`p-6 rounded-xl border transition-colors ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold">{item.category}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${isOver ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>{item.percentage_consumed.toFixed(1)}%</span>
                      <button onClick={() => handleDelete(item.id)} className="text-gray-600 hover:text-red-500"><X size={18}/></button>
                    </div>
                  </div>
                  <p className="text-2xl font-bold mb-1">${item.used_amount.toFixed(2)} <span className="text-sm font-normal text-gray-500">/ ${item.budget_amount.toFixed(2)}</span></p>
                  <p className={`text-sm mb-4 ${isOver ? 'text-red-400' : 'text-green-400'}`}>{isOver ? `Over by $${Math.abs(item.remaining_amount).toFixed(2)}` : `Remaining $${item.remaining_amount.toFixed(2)}`}</p>
                  <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <div className={`h-2 rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(item.percentage_consumed, 100)}%` }}></div>
                  </div>
                </div>);
            }))}
        </div>)}

        {budgets.length > 0 && (<div className={`mt-8 p-6 rounded-xl border flex flex-wrap justify-between items-center gap-4 ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div><p className="text-gray-400 text-sm">Total Budget</p><p className="text-2xl font-bold">${totalBudget.toFixed(2)}</p></div>
            <div className="text-right"><p className="text-gray-400 text-sm">Actual Spend</p><p className="text-2xl font-bold text-blue-400">${totalSpent.toFixed(2)}</p></div>
          </div>)}

        {isModalOpen && (<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
            <div className={`w-full max-w-md p-6 rounded-xl border space-y-6 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#12121a] border-gray-700' : 'bg-white border-gray-300'}`}>
              <div className="flex justify-between items-center"><h2 className="text-xl font-bold">Add New Budget</h2><button onClick={() => { setIsModalOpen(false); resetModal(); }} disabled={loading}><X size={24} className="text-gray-400 hover:text-white"/></button></div>
              <form onSubmit={handleAddBudget}>
                <div className="mb-4"><label className="block text-xs text-gray-400 mb-2">CATEGORY</label><input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g., Groceries" className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 ${isDark ? 'bg-[#1e1e2e] border-gray-700' : 'bg-gray-50 border-gray-300'}`} required/></div>
                <div className="mb-4"><label className="block text-xs text-gray-400 mb-2">MONTH</label><input type="month" value={newMonth} onChange={(e) => setNewMonth(e.target.value)} className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 [color-scheme:dark] ${isDark ? 'bg-[#1e1e2e] border-gray-700' : 'bg-gray-50 border-gray-300'}`} required/></div>
                <div className="mb-4"><label className="block text-xs text-gray-400 mb-2">BUDGET AMOUNT ($)</label><input type="number" step="0.01" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0.00" className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 ${isDark ? 'bg-[#1e1e2e] border-gray-700' : 'bg-gray-50 border-gray-300'}`} required/></div>

                {errorMsg && (<p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">{errorMsg}</p>)}

                <div className="flex space-x-4">
                  <button type="button" onClick={() => { setIsModalOpen(false); resetModal(); }} disabled={loading} className="flex-1 py-3 border rounded-lg transition-colors disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-70">
                    {loading ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...</>) : "Save Budget"}
                  </button>
                </div>
              </form>
            </div>
          </div>)}
      </main>
    </div>);
}