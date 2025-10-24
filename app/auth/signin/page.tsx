"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl') || '/';
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    if (result?.error) {
      setError("Invalid email or password");
    } else if (result?.ok) {
      window.location.href = callbackUrl;
    }
  }
  

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        className="bg-white p-8 rounded shadow-md max-w-sm w-full"
        onSubmit={handleSubmit}
      >
        <h1 className="mb-5 text-2xl font-bold text-gray-900">Sign In</h1>

        <label className="block mb-2 text-gray-800 font-medium">
          Email
          <input
  type="email"
  className="w-full border border-gray-300 p-2 rounded mt-1 text-gray-900 placeholder-gray-400"
  placeholder="your Email ID"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
/>

        </label>

        <label className="block mb-4 text-gray-800 font-medium">
          Password
          <input
  type="password"
  className="w-full border border-gray-300 p-2 rounded mt-1 text-gray-900 placeholder-gray-400"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  required
/>
        </label>

        {error && (
          <p className="mb-4 text-red-600 text-sm" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
