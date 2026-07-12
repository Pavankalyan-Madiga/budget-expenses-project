import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../api/axiosConfig';

export default function Calendar({ isDark }) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0-6
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/');
  }, [navigate]);

  // Fetch real expenses for this month
  const fetchEvents = async () => {
    try {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      const response = await API.get(`/expenses/?start_date=${monthStr}-01&end_date=${monthStr}-31`);
      setEvents(response.data);
    } catch (error) { console.error(error) }
  };

  useEffect(() => { fetchEvents(); }, [currentDate]);

  const changeMonth = (direction) => {
    setCurrentDate(new Date(year, month + direction, 1));
  };

  // Group events by day for the calendar dots
  const eventsByDay = events.reduce((acc, event) => {
    const day = new Date(event.expense_date).getDate();
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen">
      <Sidebar isDark={isDark} />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Calendar</h1>
            <div className="flex items-center space-x-2">
              <ChevronLeft size={18} className="cursor-pointer hover:text-blue-400" onClick={() => changeMonth(-1)} />
              <span className="text-sm font-medium min-w-[150px] text-center">{monthName}</span>
              <ChevronRight size={18} className="cursor-pointer hover:text-blue-400" onClick={() => changeMonth(1)} />
            </div>
          </div>
          <button onClick={() => setCurrentDate(new Date())} className={`px-4 py-2 border rounded-lg text-sm transition-colors ${isDark ? 'bg-[#12121a] border-gray-800 text-gray-400 hover:text-white' : 'bg-white border-gray-300 text-gray-600 hover:text-black'}`}>Today</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PERFECT CALENDAR GRID */}
          <div className={`lg:col-span-2 p-6 rounded-xl border transition-colors ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="grid grid-cols-7 gap-2 text-center mb-4">
              {daysOfWeek.map(day => (
                <div key={day} className="text-xs font-medium text-gray-500 uppercase py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for padding before day 1 */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-16" />
              ))}
              {/* Actual days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                const hasEvents = eventsByDay[day];
                
                return (
                  <div key={day} className={`h-16 rounded-lg flex flex-col items-center justify-start pt-2 text-sm relative transition-colors ${isToday ? 'bg-blue-600 text-white font-bold' : isDark ? 'bg-[#1e1e2e] text-gray-300 hover:bg-gray-800' : 'bg-gray-50 text-gray-800 hover:bg-gray-100'}`}>
                    {day}
                    {hasEvents && (
                      <div className="flex space-x-1 mt-1">
                        {hasEvents.slice(0, 3).map((ev, idx) => (
                          <div key={idx} className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-blue-500'}`}></div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Events (Synced to DB) */}
          <div className={`p-6 rounded-xl border h-fit transition-colors ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h3 className="font-semibold mb-6">Upcoming for {currentDate.toLocaleString('default', { month: 'short' })}</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {events.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No expenses this month.</p>
              ) : (
                events.map((item) => (
                  <div key={item.id} className={`flex items-center justify-between pb-4 border-b last:border-0 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${isDark ? 'bg-gray-800 text-blue-400' : 'bg-gray-100 text-blue-600'}`}>
                        {item.category.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.description}</p>
                        <p className="text-xs text-gray-500">{item.category} • {item.expense_date}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-red-400">-${item.amount.toFixed(2)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}