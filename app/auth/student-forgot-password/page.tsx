"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function StudentForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/student-forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to send password reset email."
        );
      }

      setMessage(data.message);
      setEmail("");

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#071310] px-4">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b1916] p-8 shadow-2xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            CampusConnect
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Student Portal
          </p>
        </div>

        <div className="mb-8 border-t border-white/10 pt-8">

          <p className="mb-4 inline-block rounded-full border border-emerald-400/30 px-4 py-2 text-sm text-emerald-300">
            Secure Student Account Recovery
          </p>

          <h2 className="text-4xl font-bold text-white">
            Forgot your password?
          </h2>

          <p className="mt-4 leading-7 text-gray-400">
            Enter the email address connected to your
            CampusConnect student account. We will send
            you a secure password reset link.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-950/30 p-4 text-sm text-emerald-300">
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Student email address
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="student@gmail.com"
              className="w-full rounded-xl bg-[#eef2ff] px-5 py-4 text-black outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-300 px-5 py-4 font-bold text-black transition hover:bg-emerald-200 disabled:opacity-50"
          >
            {loading
              ? "Sending..."
              : "Send Student Reset Link →"}
          </button>
        </form>

        <div className="mt-8 border-t border-white/10 pt-6 text-center">
          <Link
            href="/auth/login"
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Return to Student Portal
          </Link>
        </div>

      </div>
    </main>
  );
}