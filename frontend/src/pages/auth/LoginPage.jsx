import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Loader2, ArrowRight, Lock, Mail, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useSettings } from '../../store/SettingsContext';
import brandLogo from '../../assets/logo.png';

// API Base URL from environment variable or fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * LoginPage Component - Premium Liquid Glass Visual Direction
 * Styled with Tailwind CSS (v4)
 */
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Status states: 'idle' | 'loading' | 'error'
  const [status, setStatus] = useState('idle');
  const [apiError, setApiError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  const cardRef = useRef(null);
  const navigate = useNavigate();

  // Optionally integrate with project's AuthContext if present
  let authContext = null;
  try {
    authContext = useAuth();
  } catch (_) {
    // AuthContext optional fallback
  }

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Specular Highlight Handler (Cursor-following radial highlight)
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  // Client-side validation
  const validate = () => {
    const errors = { email: '', password: '' };
    let isValid = true;

    if (!email.trim()) {
      errors.email = 'Email address is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setStatus('loading');

    try {
      let data;
      if (authContext && authContext.login) {
        // Use AuthContext provider
        data = await authContext.login(email.trim(), password);
      } else {
        // Direct MERN POST Request to /api/auth/login
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: email.trim(),
          password
        });
        data = response.data;
        
        // Persist token in localStorage
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
      }

      // Handle Remember Me preference
      if (rememberMe) {
        localStorage.setItem('remembered_email', email.trim());
      } else {
        localStorage.removeItem('remembered_email');
      }

      setStatus('idle');

      // Seamless redirect based on role or fallback to dashboard
      const role = data?.user?.role || (data?.token ? JSON.parse(atob(data.token.split('.')[1])).role : null);
      if (role === 'admin') navigate('/admin');
      else if (role === 'vendor') navigate('/vendor');
      else if (role === 'dispatcher') navigate('/dispatcher');
      else if (role === 'rider') navigate('/rider');
      else navigate('/dashboard');

    } catch (err) {
      setStatus('error');
      const message = err.response?.data?.message || err.message || 'Invalid credentials. Please try again.';
      setApiError(message);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-950 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      
      {/* ── 1. Fluid Ambient Background Canvas ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Deep Slate Base Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black" />

        {/* Ambient Blurred Colored Orbs */}
        <div 
          className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-violet-600/30 blur-[130px] animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div 
          className="absolute top-1/2 -right-32 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-cyan-600/25 blur-[140px] animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        />
        <div 
          className="absolute -bottom-32 left-1/3 w-[460px] h-[460px] rounded-full bg-indigo-600/25 blur-[130px] animate-pulse"
          style={{ animationDuration: '12s', animationDelay: '4s' }}
        />

        {/* Subtle Grid Texture for Texture Depth */}
        <div className="absolute inset-0 bg-[radial-gradient(#rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
      </div>

      {/* ── 2. Liquid Glass Card ── */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="group relative z-10 w-full max-w-[440px] rounded-[32px] bg-white/[0.07] backdrop-blur-[28px] border border-white/[0.18] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] p-8 sm:p-10 transition-all duration-300 overflow-hidden"
      >
        {/* Subtle Top-Edge Specular Light Streak */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        {/* Cursor-Following Specular Highlight Overlay */}
        <div
          className="pointer-events-none absolute -inset-px rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(500px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.14), transparent 40%)`
          }}
        />

        {/* Header / Brand Logo */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-white/95 border border-white/60 shadow-[0_8px_25px_rgba(0,0,0,0.35)] mb-3 backdrop-blur-md">
            <img src={brandLogo} alt="KDM Express Logo" className="h-14 max-w-[240px] object-contain drop-shadow-sm" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
            Welcome Back
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            Sign in to access your KDM Express portal
          </p>
        </div>

        {/* Inline API Error Alert */}
        {status === 'error' && apiError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-medium flex items-start gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 relative z-10">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{apiError}</span>
          </div>
        )}

        {/* Form Controls Container */}
        <div className="space-y-6 relative z-10">
          
          {/* Email Input Field with Floating Label */}
          <div className="space-y-1">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder=" "
                disabled={status === 'loading'}
                className={`peer w-full pl-12 pr-4 pt-5 pb-2 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border ${
                  fieldErrors.email ? 'border-red-400/60 focus:border-red-400' : 'border-white/10 focus:border-cyan-400/60'
                } rounded-2xl text-white text-sm outline-none transition-all duration-200 focus:ring-4 ${
                  fieldErrors.email ? 'focus:ring-red-400/15' : 'focus:ring-cyan-400/15'
                } disabled:opacity-50`}
              />
              <label
                htmlFor="email"
                className="absolute left-12 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-all duration-200 pointer-events-none peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-cyan-300 peer-[&:not(:placeholder-shown)]:top-1.5 peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:text-slate-300"
              >
                Email Address
              </label>
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-red-400 font-medium pl-3 pt-1 animate-in fade-in duration-150">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password Input Field with Floating Label & Toggle */}
          <div className="space-y-1">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder=" "
                disabled={status === 'loading'}
                className={`peer w-full pl-12 pr-12 pt-5 pb-2 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border ${
                  fieldErrors.password ? 'border-red-400/60 focus:border-red-400' : 'border-white/10 focus:border-cyan-400/60'
                } rounded-2xl text-white text-sm outline-none transition-all duration-200 focus:ring-4 ${
                  fieldErrors.password ? 'focus:ring-red-400/15' : 'focus:ring-cyan-400/15'
                } disabled:opacity-50`}
              />
              <label
                htmlFor="password"
                className="absolute left-12 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-all duration-200 pointer-events-none peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-cyan-300 peer-[&:not(:placeholder-shown)]:top-1.5 peer-[&:not(:placeholder-shown)]:text-[10px] peer-[&:not(:placeholder-shown)]:text-slate-300"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-red-400 font-medium pl-3 pt-1 animate-in fade-in duration-150">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Remember Me Row */}
          <div className="flex items-center text-xs sm:text-sm pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer group select-none">
              <div className={`w-4 h-4 rounded-md border transition-all duration-150 flex items-center justify-center ${
                rememberMe ? 'bg-cyan-500 border-cyan-400 text-slate-950' : 'border-white/20 bg-white/[0.05] group-hover:border-white/40'
              }`}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="text-slate-300 font-medium group-hover:text-white transition-colors">
                Remember me
              </span>
            </label>
          </div>

          {/* Primary Action Button - Glossy Gradient with Top Specular Bar */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={status === 'loading'}
            className="relative w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-400 text-white font-bold text-sm tracking-wide shadow-[0_12px_24px_-8px_rgba(108,92,231,0.5)] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none disabled:transform-none overflow-hidden group/btn"
          >
            {/* Top Third Specular Glass Bar */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-center gap-2">
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </>
              )}
            </div>
          </button>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
