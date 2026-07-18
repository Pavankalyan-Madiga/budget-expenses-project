import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../api/axiosConfig';
export default function Calendar({ isDark, toggleTheme }) {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    useEffect(() => {
        if (!localStorage.getItem('token'))
            navigate('/');
    }, [navigate]);
    const fetchEvents = async () => {
        try {
            const lastDay = new Date(year, month + 1, 0).getDate();
            const response = await API.get(`/expenses/?start_date=${monthStr}-01&end_date=${monthStr}-${String(lastDay).padStart(2, '0')}`);
            setEvents(response.data);
        }
        catch (error) {
            console.error(error);
        }
    };
    const fetchBudgets = async () => {
        try {
            const response = await API.get(`/budgets/?month=${monthStr}`);
            setBudgets(response.data);
        }
        catch (error) {
            console.error(error);
        }
    };
    useEffect(() => {
        fetchEvents();
        fetchBudgets();
        setSelectedDay(null);
    }, [currentDate]);
    const changeMonth = (direction) => {
        setCurrentDate(new Date(year, month + direction, 1));
    };
    const eventsByDay = events.reduce((acc, event) => {
        const day = new Date(event.expense_date).getDate();
        if (!acc[day])
            acc[day] = [];
        acc[day].push(event);
        return acc;
    }, {});
    const selectedDayEvents = selectedDay ? (eventsByDay[selectedDay] || []) : [];
    const selectedDayTotal = selectedDayEvents.reduce((sum, e) => sum + e.amount, 0);
    const selectedDayCategories = [...new Set(selectedDayEvents.map(e => e.category))];
    const relevantBudgets = budgets.filter(b => selectedDayCategories.includes(b.category));
    const selectedDateLabel = selectedDay
        ? new Date(year, month, selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        : '';
    return (<div className={`flex min-h-screen transition-colors ${isDark ? 'bg-[#0a0a0f] text-white' : 'bg-gray-100 text-black'}`}>
      <Sidebar isDark={isDark} toggleTheme={toggleTheme}/>
      <main className="flex-1 p-4 pt-20 sm:p-6 sm:pt-24 lg:p-8 lg:pt-8 overflow-y-auto min-w-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-2xl font-bold">Calendar</h1>
            <div className="flex items-center space-x-2">
              <ChevronLeft size={18} className="cursor-pointer hover:text-blue-400" onClick={() => changeMonth(-1)}/>
              <span className="text-sm font-medium min-w-[130px] sm:min-w-[150px] text-center">{monthName}</span>
              <ChevronRight size={18} className="cursor-pointer hover:text-blue-400" onClick={() => changeMonth(1)}/>
            </div>
          </div>
          <button onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date().getDate()); }} className={`self-start sm:self-auto px-4 py-2 border rounded-lg text-sm transition-colors ${isDark ? 'bg-[#12121a] border-gray-800 text-gray-400 hover:text-white' : 'bg-white border-gray-300 text-gray-600 hover:text-black'}`}>Today</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 p-6 rounded-xl border transition-colors ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="grid grid-cols-7 gap-2 text-center mb-4">
              {daysOfWeek.map(day => (<div key={day} className="text-xs font-medium text-gray-500 uppercase py-2">{day}</div>))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (<div key={`empty-${i}`} className="h-12 sm:h-16"/>))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            const isSelected = day === selectedDay;
            const hasEvents = eventsByDay[day];
            return (<div key={day} onClick={() => setSelectedDay(day)} className={`h-12 sm:h-16 rounded-lg flex flex-col items-center justify-start pt-1.5 sm:pt-2 text-xs sm:text-sm relative transition-colors cursor-pointer ${isSelected ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400' :
                    isToday ? (isDark ? 'bg-[#1e1e2e] text-blue-400 font-bold border border-blue-500' : 'bg-blue-50 text-blue-600 font-bold border border-blue-400') :
                        isDark ? 'bg-[#1e1e2e] text-gray-300 hover:bg-gray-800' : 'bg-gray-50 text-gray-800 hover:bg-gray-100'}`}>
                    {day}
                    {hasEvents && (<div className="flex space-x-1 mt-1">
                        {hasEvents.slice(0, 3).map((ev, idx) => (<div key={idx} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></div>))}
                      </div>)}
                  </div>);
        })}
            </div>
          </div>

          <div className={`p-6 rounded-xl border h-fit transition-colors ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h3 className="font-semibold mb-6">Upcoming for {currentDate.toLocaleString('default', { month: 'short' })}</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {events.length === 0 ? (<p className="text-sm text-gray-500 text-center py-8">No expenses this month.</p>) : (events.map((item) => (<div key={item.id} className={`flex items-center justify-between pb-4 border-b last:border-0 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${isDark ? 'bg-gray-800 text-blue-400' : 'bg-gray-100 text-blue-600'}`}>
                        {item.category ? item.category.charAt(0) : '🏦'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.description}</p>
                        <p className="text-xs text-gray-500">{item.category || (item.account_name ? `Bank: ${item.account_name}` : 'Bank Account')} • {item.expense_date}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-red-400">-${item.amount.toFixed(2)}</p>
                  </div>)))}
            </div>
          </div>
        </div>

        {selectedDay && (<div className={`mt-6 p-6 rounded-xl border transition-colors ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold">{selectedDateLabel}</h3>
              {selectedDayEvents.length > 0 && (<span className="text-sm font-semibold text-red-400">Total: -${selectedDayTotal.toFixed(2)}</span>)}
            </div>

            {selectedDayEvents.length === 0 ? (<p className="text-sm text-gray-500 text-center py-6">No expenses on this day.</p>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-3">Expenses</p>
                  <div className="space-y-3">
                    {selectedDayEvents.map((item) => (<div key={item.id} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-[#1e1e2e]' : 'bg-gray-50'}`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${isDark ? 'bg-gray-800 text-blue-400' : 'bg-gray-100 text-blue-600'}`}>
                            {item.category ? item.category.charAt(0) : '🏦'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.description}</p>
                            <p className="text-xs text-gray-500">{item.category || (item.account_name ? `Bank: ${item.account_name}` : 'Bank Account')}</p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-red-400">-${item.amount.toFixed(2)}</p>
                      </div>))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase mb-3">Budget Status ({monthName})</p>
                  {relevantBudgets.length === 0 ? (<p className="text-sm text-gray-500">No budget set for these categories.</p>) : (<div className="space-y-3">
                      {relevantBudgets.map((b) => {
                        const isOver = b.remaining_amount < 0;
                        return (<div key={b.id} className={`p-3 rounded-lg ${isDark ? 'bg-[#1e1e2e]' : 'bg-gray-50'}`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">{b.category}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isOver ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>{b.percentage_consumed.toFixed(1)}%</span>
                            </div>
                            <div className={`w-full rounded-full h-1.5 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                              <div className={`h-1.5 rounded-full ${isOver ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(b.percentage_consumed, 100)}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">${b.used_amount.toFixed(2)} / ${b.budget_amount.toFixed(2)}</p>
                          </div>);
                    })}
                    </div>)}
                </div>
              </div>)}
          </div>)}
      </main>
    </div>);
}