import { Routes, Route, Navigate, useState } from 'react-router-dom';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Calendar from './pages/Calendar';
import Accounts from './pages/Accounts';

function App() {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.body.classList.toggle('light-mode', !newTheme);
  };

  return (
    <Routes>
      <Route path="/" element={<SignIn />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard isDark={isDark} />} />
      <Route path="/expenses" element={<Expenses isDark={isDark} />} />
      <Route path="/budgets" element={<Budgets isDark={isDark} />} />
      <Route path="/calendar" element={<Calendar isDark={isDark} />} />
      <Route path="/accounts" element={<Accounts isDark={isDark} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;