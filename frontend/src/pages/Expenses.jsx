import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { X, Upload, Plus } from 'lucide-react';
import API from '../api/axiosConfig';

export default function Expenses({ isDark, toggleTheme }) {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false); // State for the loading spinner
  
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/');
  }, [navigate]);

  const fetchCategories = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const response = await API.get(`/budgets/?month=${currentMonth}`);
      const cats = response.data.map(b => b.category);
      setBudgetCategories(cats);
      if (cats.length > 0 && !category) setCategory(cats[0]);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await API.get('/expenses/');
      setExpenses(response.data);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!amount || !date || !description || !category) {
      // You can replace this with a small red text error under the button if you prefer, 
      // but for now it prevents empty submissions.
      return; 
    }

    setLoading(true); // Start circular loading

    try {
      await API.post('/expenses/', {
        amount: parseFloat(amount),
        category: category,
        description: description,
        expense_date: date
      });
      
      setIsOpen(false); // Close modal only AFTER successful save
      resetForm();
      fetchExpenses(); 
    } catch (error) {
      console.error("Failed to save expense.", error);
      // Optionally show a small error message in the UI here instead of alert
    } finally {
      setLoading(false); // Stop circular loading
    }
  };

  const resetForm = () => {
    setAmount('');
    setDate('');
    setDescription('');
    if (budgetCategories.length > 0) setCategory(budgetCategories[0]);
    else setCategory('');
  };

  return (
    <div className={`flex min-h-screen transition-colors ${isDark ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-black'}`}>
      <Sidebar isDark={isDark} toggleTheme={toggleTheme} />
      <main className="flex-1 p-8 relative overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Expenses</h1>
          <button onClick={() => setIsOpen(true)} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={18} />
            <span>Add Expense</span>
          </button>
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
              {expenses.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No expenses found.</td></tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className={`border-b transition-colors ${isDark ? 'border-gray-800 hover:bg-[#1e1e2e]' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className="px-6 py-4 font-medium">{exp.description}</td>
                    <td className="px-6 py-4 text-gray-400">{exp.category}</td>
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
                        <option value="" disabled>No budgets set yet</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-gray-400 mb-2">DESCRIPTION</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was this for?" className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" required />
                </div>

                {/* Made Optional visually */}
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-gray-500 transition-colors mb-6">
                  <Upload size={24} className="mb-2" />
                  <p className="text-sm">Upload receipt <span className="text-xs text-gray-600">(Optional)</span></p>
                </div>

                <div className="flex space-x-4">
                  <button type="button" onClick={() => { setIsOpen(false); resetForm(); }} disabled={loading} className="flex-1 py-3 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">Cancel</button>
                  
                  {/* Circular Loading Spinner added here */}
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