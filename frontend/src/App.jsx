import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Budgets from './pages/Budgets';
import Calendar from './pages/Calendar';
import Accounts from './pages/Accounts';
function RedirectIfAuthed({ children }) {
    const token = localStorage.getItem('token');
    return token ? <Navigate to="/dashboard" replace/> : children;
}
function RequireAuth({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/" replace/>;
}
function App() {
    const [isDark, setIsDark] = useState(true);
    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        document.body.classList.toggle('light-mode', !newTheme);
    };
    return (<Routes>
      <Route path="/" element={<RedirectIfAuthed><SignIn /></RedirectIfAuthed>}/>
      <Route path="/register" element={<RedirectIfAuthed><Register /></RedirectIfAuthed>}/>
      <Route path="/dashboard" element={<RequireAuth><Dashboard isDark={isDark} toggleTheme={toggleTheme}/></RequireAuth>}/>
      <Route path="/expenses" element={<RequireAuth><Expenses isDark={isDark} toggleTheme={toggleTheme}/></RequireAuth>}/>
      <Route path="/budgets" element={<RequireAuth><Budgets isDark={isDark} toggleTheme={toggleTheme}/></RequireAuth>}/>
      <Route path="/calendar" element={<RequireAuth><Calendar isDark={isDark} toggleTheme={toggleTheme}/></RequireAuth>}/>
      <Route path="/accounts" element={<RequireAuth><Accounts isDark={isDark} toggleTheme={toggleTheme}/></RequireAuth>}/>
      <Route path="*" element={<Navigate to="/"/>}/>
    </Routes>);
}
export default App;