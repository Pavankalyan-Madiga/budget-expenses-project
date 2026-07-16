import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import API from '../api/axiosConfig';

const data = [
  { name: 'Mon', uv: 40 }, { name: 'Tue', uv: 60 }, { name: 'Wed', uv: 30 },
  { name: 'Thu', uv: 80 }, { name: 'Fri', uv: 50 }, { name: 'Sat', uv: 70 }, { name: 'Sun', uv: 20 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip bg-gray-800 p-2 border border-gray-700 rounded text-xs text-gray-300">
        <p>{`${label}: ${payload[0].value}ms`}</p>
      </div>
    );
  }
  return null;
};

// Small circular loader used inside buttons while a request is in flight.
function Spinner({ className = 'h-4 w-4' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSlowNotice(false);
    setErrorMsg('');
    // The free-tier backend spins down when idle, so the first request after
    // a while can take 30-60s to "wake up". Let the user know instead of
    // leaving them staring at a stuck button.
    const slowTimer = setTimeout(() => setSlowNotice(true), 4000);
    try {
      const response = await API.post('/auth/login', { email, password });
      // Save the JWT token to local storage
      localStorage.setItem('token', response.data.access_token);
      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (error) {
      setErrorMsg('Login failed. Please check your credentials and try again.');
      console.error(error);
    } finally {
      clearTimeout(slowTimer);
      setLoading(false);
      setSlowNotice(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0f] text-white font-sans">
      {/* Left Side */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FinTrack <span className="text-blue-500">Finance</span></h1>
        </div>
        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">Precision finance for the <br/><span className="text-blue-400">modern analyst.</span></h2>
          <p className="text-gray-400 max-w-md">Leverage real-time data visualization and automated expense tracking to manage your digital assets securely.</p>
        </div>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}><Tooltip content={<CustomTooltip />} cursor={false} /><Bar dataKey="uv" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 bg-[#12121a] flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-semibold tracking-tight">Sign In</h2>
            <p className="text-gray-500 text-sm mt-2">Enter your credentials to access your account</p>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-60" placeholder="finance.lead@agency.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-60" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3 rounded-lg transition-colors">
              {loading && <Spinner />}
              {loading ? 'Signing In...' : 'Continue to Dashboard'}
            </button>
            {slowNotice && (
              <p className="text-xs text-gray-500 text-center">
                Still working — the server can take up to a minute to wake up on its first request.
              </p>
            )}
          </form>

          {/* FIXED NAVIGATION HERE */}
          <p className="text-center text-sm text-gray-500">
            Don't have an account? <Link to="/register" className="text-blue-500 hover:text-blue-400 font-medium">Create a new account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}