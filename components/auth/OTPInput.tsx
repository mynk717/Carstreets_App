'use client';

import { useState, useRef, useEffect } from 'react';

interface OTPInputProps {
  length: number;
  onComplete: (otp: string) => Promise<void>;
  error?: string;
  loading?: boolean;
}

export default function OTPInput({ length, onComplete, error, loading }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedData = value.slice(0, length).split('');
      const newOtp = [...otp];
      pastedData.forEach((char, i) => {
        if (index + i < length) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      
      // Focus last filled input
      const lastFilledIndex = Math.min(index + pastedData.length, length - 1);
      inputRefs.current[lastFilledIndex]?.focus();
      
      // Auto-submit if complete
      if (newOtp.every(digit => digit !== '')) {
        onComplete(newOtp.join(''));
      }
      return;
    }

    // Single character input
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if complete
    if (value && index === length - 1 && newOtp.every(digit => digit !== '')) {
      onComplete(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div>
      <div className="flex gap-2 justify-center mb-4">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={loading}
            className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              error ? 'border-red-500' : 'border-gray-300'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        ))}
      </div>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}

      {loading && (
        <p className="text-blue-600 text-sm text-center">Verifying...</p>
      )}
    </div>
  );
}
