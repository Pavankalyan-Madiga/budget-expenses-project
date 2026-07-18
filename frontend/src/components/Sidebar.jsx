import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, Wallet, CalendarDays, Landmark, LogOut, Sun, Moon, Menu, X } from 'lucide-react';
const NAV_ITEMS = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/expenses', icon: Receipt, label: 'Expenses' },
    { to: '/budgets', icon: Wallet, label: 'Budgets' },
    { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
    { to: '/accounts', icon: Landmark, label: 'Accounts' },
];
export default function Sidebar({ isDark, toggleTheme }) {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const handleSignOut = () => {
        localStorage.removeItem('token');
        navigate('/');
    };
    const SidebarContent = ({ onNavigate }) => (<>
      <div>
        <h1 className="text-xl font-bold mb-10">
          FinTrack <span className="text-blue-500">Finance</span>
        </h1>
        <nav className="space-y-2">
          {NAV_ITEMS.map((item) => (<NavLink key={item.to} to={item.to} onClick={onNavigate} className={({ isActive }) => `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600/20 text-blue-400' : (isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black')}`}>
              <item.icon size={20}/>
              <span>{item.label}</span>
            </NavLink>))}
        </nav>
      </div>

      <div className={`space-y-4 pt-6 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <button onClick={toggleTheme} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black'}`}>
          {isDark ? <Moon size={20}/> : <Sun size={20}/>}
          <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        <button onClick={handleSignOut} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut size={20}/>
          <span>Sign Out</span>
        </button>
      </div>
    </>);
    return (<>

      <div className={`hidden lg:flex w-64 min-h-screen border-r p-6 flex-col justify-between transition-colors duration-300 ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'}`}>
        <SidebarContent />
      </div>

      <div className={`lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-16 border-b transition-colors ${isDark ? 'bg-[#12121a] border-gray-800' : 'bg-white border-gray-200'}`}>
        <h1 className="text-lg font-bold">
          FinTrack <span className="text-blue-500">Finance</span>
        </h1>
        <button onClick={() => setIsOpen(true)} className={isDark ? 'text-gray-300' : 'text-gray-700'} aria-label="Open menu">
          <Menu size={26}/>
        </button>
      </div>

      {isOpen && (<div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsOpen(false)}/>
          <div className={`relative w-72 max-w-[80vw] min-h-screen p-6 flex flex-col justify-between overflow-y-auto transition-colors ${isDark ? 'bg-[#12121a]' : 'bg-white'}`}>
            <button onClick={() => setIsOpen(false)} className={`absolute top-4 right-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} aria-label="Close menu">
              <X size={22}/>
            </button>
            <SidebarContent onNavigate={() => setIsOpen(false)}/>
          </div>
        </div>)}
    </>);
}