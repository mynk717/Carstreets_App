'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            {success ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <Lock className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {success ? 'Password Reset!' : 'Reset Password'}
          </h1>
          <p className="text-gray-600">
            {success
              ? 'Redirecting to login...'
              : 'Enter your new password below.'}
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
                className="w-full"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        ) : (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center">
            Password reset successfully! Redirecting to login...
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
