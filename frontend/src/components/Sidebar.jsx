import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, Wallet, CalendarDays, Landmark, LogOut, Sun, Moon } from 'lucide-react';

export default function Sidebar({ isDark, toggleTheme }) {
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className={`w-64 min-h-screen border-r p-6 flex flex-col justify-between transition-colors duration-300 ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'}`}>
      <div>
        <h1 className="text-xl font-bold mb-10">
          FinTrack <span className="text-blue-500">Finance</span>
        </h1>
        <nav className="space-y-2">
          {[
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/expenses', icon: Receipt, label: 'Expenses' },
            { to: '/budgets', icon: Wallet, label: 'Budgets' },
            { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
            { to: '/accounts', icon: Landmark, label: 'Accounts' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-600/20 text-blue-400' : (isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black')
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="space-y-4 pt-6 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}">
        <button onClick={toggleTheme} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`}>
          {isDark ? <Moon size={20} /> : <Sun size={20} />}
          <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        <button onClick={handleSignOut} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}