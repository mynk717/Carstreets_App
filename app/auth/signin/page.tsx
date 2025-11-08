'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (result?.error) {
      // Check if account is locked
      if (result.error.includes('locked')) {
        setError('Account temporarily locked due to multiple failed attempts. Please try again in 30 minutes.');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } else if (result?.ok) {
      // Get session to determine redirect
      const sessionResponse = await fetch('/api/auth/session');
      const session = await sessionResponse.json();
      
      // Priority: If user has subdomain (is a dealer), go to dealer dashboard
      if (session?.user?.subdomain) {
        window.location.href = callbackUrl || `/dealers/${session.user.subdomain}/dashboard`;
      } 
      // Fallback 1: Check if admin email (from env) but no dealer account
      else if (session?.user?.role === 'admin') {
        window.location.href = callbackUrl || '/admin/cars';
      }
      // Fallback 2: Logged in but no subdomain (corrupted dealer account)
      else {
        console.error('User logged in but no subdomain or admin role');
        window.location.href = '/get-started?step=3';
      }
    }

  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-600">
            Sign in to your dealer account
          </p>
        </div>

        {/* Sign In Form */}
        <form 
          className="bg-white p-8 rounded-2xl shadow-xl" 
          onSubmit={handleSubmit}
        >
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Sign In</h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Email Field */}
          <label className="block mb-4">
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </span>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          {/* Password Field */}
          <label className="block mb-6">
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </span>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {/* Forgot Password Link */}
          <div className="text-right mb-6">
            <a 
              href="/forgot-password" 
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </a>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign in with</span>
              </div>
            </div>
          </div>

          {/* WhatsApp OTP Login (Future) */}
          <button
            type="button"
            onClick={() => alert('WhatsApp OTP login coming soon!')}
            className="w-full px-6 py-3 border-2 border-green-500 text-green-600 hover:bg-green-50 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            Sign in with WhatsApp OTP
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center bg-white p-6 rounded-2xl shadow-xl border-t border-gray-200">
          <p className="text-gray-600 text-sm mb-3">
            Don't have an account?
          </p>
          <a
            href="/get-started"
            className="inline-block w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Create New Account
          </a>
        </div>

        {/* Footer Help Text */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Need help? <a href="mailto:support@mktgdime.com" className="text-blue-600 hover:text-blue-700">Contact Support</a>
        </p>
      </div>
    </div>
  );
}
