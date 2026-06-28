import React, { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Package, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'vendor') navigate('/vendor');
      else if (data.user.role === 'dispatcher') navigate('/dispatcher');
      else if (data.user.role === 'rider') navigate('/rider');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F3F4F6] relative overflow-hidden">
      
      <div className="w-full max-w-md neumorphic-panel p-10 sm:p-12 relative z-10 animate-fadeInUp">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 neumorphic-circle text-brand-600">
              <Package className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">ktmexpress</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-slate-500 text-sm font-medium">Sign in to your logistics workspace</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-xl animate-scaleIn">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              placeholder="name@ktmexpress.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="input-field"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="input-field pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Enter Workspace
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 text-center border-t border-slate-100 pt-6">
          <p className="text-xs font-semibold text-slate-400">ktmexpress Logistics SaaS Platform &bull; v2.0</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
