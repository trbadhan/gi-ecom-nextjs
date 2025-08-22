"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; 
import { startProgress, stopProgress } from "@/lib/progress";

export default function LoginPage() {
  const router = useRouter();
  const { login, token, admin, loading } = useAuth();  // ✅ use token & admin too

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // ✅ Auto redirect if already logged in
  useEffect(() => {
    if (!loading && token && admin) {
      router.replace("/dashboard"); // replace so user can't go back to /login
    }
  }, [loading, token, admin, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError(null);
      startProgress();

      const success = await login(username, password);

      if (success) {
        router.push("/dashboard");
      } else {
        setError("Invalid credentials, please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Login failed, please try again.");
    } finally {
      stopProgress();
    }
  }

  // ✅ While checking localStorage/session, don't flash form
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded shadow-md w-full max-w-sm"
      >
        <h1 className="text-xl font-bold mb-4">Admin Login</h1>

        {error && <p className="text-red-600 mb-3">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-3"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-3"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}
