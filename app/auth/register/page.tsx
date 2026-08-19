"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // STUDENT REGISTRATION ONLY
  const role = "STUDENT";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Registration failed.");
        return;
      }

      // Registration successful
      setSuccess(true);

      // Clear form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06110f] text-white">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">

        {/* BACKGROUND */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-120px] top-[-120px] h-[350px] w-[350px] rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="absolute bottom-[-150px] right-[-100px] h-[400px] w-[400px] rounded-full bg-teal-500/10 blur-3xl" />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(30,180,130,0.06),transparent_35%)]" />
        </div>

        <div className="relative z-10 w-full max-w-xl">

          {/* HEADER */}
          <div className="mb-8 text-center">

            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <GraduationCap size={30} />
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Create Student Account
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Join the CampusConnect campus management platform
            </p>

          </div>

          {/* CARD */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">

            {/* STUDENT INFORMATION */}
            <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">

              <div className="flex gap-3">

                <GraduationCap
                  size={20}
                  className="mt-0.5 shrink-0 text-emerald-400"
                />

                <div>

                  <p className="text-sm font-semibold text-emerald-300">
                    Student Registration
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Your registration will be reviewed by an
                    authorized Admin before you can access the
                    student portal.
                  </p>

                </div>

              </div>

            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* NAME */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Full name
                </label>

                <div className="relative">

                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Enter your full name"
                    autoComplete="name"
                    className="h-13 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-500/10"
                  />

                </div>

              </div>

              {/* EMAIL */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email address
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Enter your email"
                    autoComplete="email"
                    className="h-13 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-500/10"
                  />

                </div>

              </div>

              {/* PASSWORD */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Create a password"
                    autoComplete="new-password"
                    className="h-13 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

                <p className="mt-2 text-xs text-slate-600">
                  Password must contain at least 8 characters.
                </p>

              </div>

              {/* CONFIRM PASSWORD */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Confirm password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    className="h-13 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

              </div>

              {/* ERROR */}
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
                  {error}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-13 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Submit registration

                    <ArrowRight
                      size={18}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </>
                )}

              </button>

            </form>

            {/* APPROVAL INFORMATION */}
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.025] p-4">

              <div className="flex gap-3">

                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-400"
                />

                <div>

                  <p className="text-sm font-semibold text-slate-300">
                    Approval required
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your student account must be approved by
                    an Admin before you can sign in.
                  </p>

                </div>

              </div>

            </div>

            {/* LOGIN */}
            <div className="mt-7 text-center text-sm text-slate-500">

              Already have an account?{" "}

              <Link
                href="/auth/login"
                className="font-semibold text-emerald-400 transition hover:text-emerald-300"
              >
                Sign in
              </Link>

            </div>

          </div>

          {/* FOOTER */}
          <div className="mt-7 text-center">

            <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
              <ShieldCheck size={14} />
              Your connection is protected
            </div>

            <p className="mt-3 text-xs text-slate-700">
              CampusConnect Student Portal
            </p>

            <p className="mt-1 text-xs text-slate-700">
              Smart campus management platform
            </p>

          </div>

        </div>
      </div>

      {/* =====================================================
          SUCCESS DIALOG
      ====================================================== */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1916] p-7 shadow-2xl shadow-black/50">

            {/* ICON */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">

              <CheckCircle2
                size={34}
                className="text-emerald-400"
              />

            </div>

            {/* TITLE */}
            <div className="mt-5 text-center">

              <h2 className="text-2xl font-bold text-white">
                Registration Submitted
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Your student account has been created
                successfully and is now waiting for approval.
              </p>

            </div>

            {/* APPROVAL MESSAGE */}
            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">

              <div className="flex gap-3">

                <ShieldCheck
                  size={20}
                  className="mt-0.5 shrink-0 text-emerald-400"
                />

                <div>

                  <p className="text-sm font-semibold text-emerald-300">
                    Approval pending
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    An authorized Admin must approve your
                    account before you can access the Student
                    Portal.
                  </p>

                </div>

              </div>

            </div>

            {/* RETURN TO LOGIN */}
            <Link
              href="/auth/login"
              className="group mt-6 flex h-13 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500"
            >
              Return to Student Login

              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            {/* CLOSE */}
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="mt-4 w-full text-center text-xs text-slate-600 transition hover:text-slate-400"
            >
              Close
            </button>

          </div>

        </div>
      )}
    </div>
  );
}