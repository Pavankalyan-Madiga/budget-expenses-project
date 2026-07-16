import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import API from '../api/axiosConfig';

const data = [{ name: 'Mon', uv: 40 }, { name: 'Tue', uv: 60 }, { name: 'Wed', uv: 30 }, { name: 'Thu', uv: 80 }, { name: 'Fri', uv: 50 }];

// Small circular loader used inside buttons while a request is in flight.
function Spinner({ className = 'h-4 w-4' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSlowNotice(false);
    setErrorMsg('');
    setSuccessMsg('');
    // The free-tier backend spins down when idle, so the first request after
    // a while can take 30-60s to "wake up". Let the user know instead of
    // leaving them staring at a stuck button.
    const slowTimer = setTimeout(() => setSlowNotice(true), 4000);
    try {
      // Matches your FastAPI UserCreate schema exactly
      await API.post('/auth/register', { name, email, password });
      setSuccessMsg('Account created successfully! Redirecting to sign in...');
      setTimeout(() => navigate('/'), 1200);
    } catch (error) {
      setErrorMsg('Registration failed. That email might already be in use.');
      console.error(error);
      setLoading(false);
    } finally {
      clearTimeout(slowTimer);
      setSlowNotice(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0f] text-white font-sans">
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FinTrack <span className="text-blue-500">Finance</span></h1>
        </div>
        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight">Precision finance for the <br/><span className="text-blue-400">modern analyst.</span></h2>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={data}><Tooltip /><Bar dataKey="uv" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 bg-[#12121a] flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Create Analyst Account</h2>
            <p className="text-gray-500 text-sm mt-2">Enter your details to get started</p>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
              <Spinner className="h-4 w-4" />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-60" placeholder="John Doe" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-60" placeholder="finance@agency.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="w-full bg-[#1e1e2e] border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-60" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3 rounded-lg transition-colors">
              {loading && <Spinner />}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
            {slowNotice && (
              <p className="text-xs text-gray-500 text-center">
                Still working — the server can take up to a minute to wake up on its first request.
              </p>
            )}
          </form>

          <p className="text-center text-sm text-gray-500">
            Already have an account? <Link to="/" className="text-blue-500 hover:text-blue-400 font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}