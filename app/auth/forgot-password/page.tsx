"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Mail,
  ShieldCheck,
} from "lucide-react";

type Portal = "student" | "admin";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();

  const requestedPortal = searchParams.get("portal");

  const portal: Portal =
    requestedPortal === "admin" ? "admin" : "student";

  const isAdmin = portal === "admin";

  /*
   * IMPORTANT:
   * Student and Admin now use different forgot-password APIs.
   */
  const forgotPasswordApi = isAdmin
    ? "/api/auth/forgot-password"
    : "/api/auth/student-forgot-password";

  const loginUrl = isAdmin
    ? "/admin/login"
    : "/auth/login";

  const portalName = isAdmin
    ? "Admin Portal"
    : "Student Portal";

  const emailPlaceholder = isAdmin
    ? "admin@campusconnect.com"
    : "student@campusconnect.com";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  /*
   * =========================================================
   * SEND PASSWORD RESET LINK
   * =========================================================
   */

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess(false);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        forgotPasswordApi,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",
          cache: "no-store",

          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      let data: {
        success?: boolean;
        message?: string;
      };

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Invalid response from the server."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to send the password reset link."
        );
      }

      setSuccess(true);
    } catch (err) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to send the password reset link."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#061510] text-white">

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div
        className={`absolute inset-0 ${
          isAdmin
            ? "bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(99,102,241,0.18),transparent_30%),linear-gradient(135deg,#06101f,#071526_45%,#101426)]"
            : "bg-[radial-gradient(circle_at_15%_20%,rgba(75,200,150,0.18),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(90,90,180,0.18),transparent_30%),linear-gradient(135deg,#061510,#071b18_45%,#101426)]"
        }`}
      />

      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div
        className={`absolute left-[12%] top-[25%] h-3 w-3 rounded-full ${
          isAdmin
            ? "bg-blue-300/70 shadow-[0_0_25px_rgba(147,197,253,0.8)]"
            : "bg-emerald-300/70 shadow-[0_0_25px_rgba(110,231,183,0.8)]"
        }`}
      />

      <div
        className={`absolute right-[15%] top-[35%] h-3 w-3 rounded-full ${
          isAdmin
            ? "bg-indigo-300/60 shadow-[0_0_25px_rgba(165,180,252,0.8)]"
            : "bg-teal-300/60 shadow-[0_0_25px_rgba(94,234,212,0.8)]"
        }`}
      />

      <div
        className={`absolute bottom-[10%] left-[25%] h-64 w-64 rounded-full blur-3xl ${
          isAdmin
            ? "bg-blue-500/10"
            : "bg-emerald-500/10"
        }`}
      />

      <div
        className={`absolute right-[15%] top-[10%] h-72 w-72 rounded-full blur-3xl ${
          isAdmin
            ? "bg-indigo-500/10"
            : "bg-teal-500/10"
        }`}
      />

      {/* =====================================================
          MAIN
      ====================================================== */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">

        <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-black/25 p-7 shadow-2xl backdrop-blur-xl sm:p-10">

          {/* LOGO */}

          <div className="flex items-center gap-4">

            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl text-slate-950 shadow-lg ${
                isAdmin
                  ? "bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-500/20"
                  : "bg-gradient-to-br from-emerald-400 to-teal-400 shadow-emerald-500/20"
              }`}
            >
              <GraduationCap size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                CampusConnect
              </h1>

              <p className="text-sm text-slate-400">
                Smart Campus Management
              </p>
            </div>

          </div>

          <div className="my-9 h-px bg-white/10" />

          {!success ? (
            <>
              {/* HEADER */}

              <div className="mb-8">

                <div
                  className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                    isAdmin
                      ? "border border-blue-400/20 bg-blue-400/10 text-blue-300"
                      : "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  }`}
                >
                  <ShieldCheck size={14} />

                  {isAdmin
                    ? "Secure admin account recovery"
                    : "Secure student account recovery"}
                </div>

                <h2 className="text-3xl font-bold tracking-tight">
                  Forgot your password?
                </h2>

                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
                  Enter the email address connected to your
                  CampusConnect{" "}
                  {portalName.toLowerCase()}.
                  We will send you a secure password reset link.
                </p>

              </div>

              {/* ERROR */}

              {error && (
                <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* FORM */}

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    {isAdmin
                      ? "Admin email address"
                      : "Student email address"}
                  </label>

                  <div className="relative">

                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder={emailPlaceholder}
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      required
                      disabled={loading}
                      className={`w-full rounded-xl border border-white/10 bg-white/[0.05] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60 ${
                        isAdmin
                          ? "focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/10"
                          : "focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
                      }`}
                    />

                  </div>

                </div>

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={loading}
                  className={`group flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-slate-950 shadow-lg transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
                    isAdmin
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/20 hover:shadow-blue-500/30"
                      : "bg-gradient-to-r from-emerald-400 to-teal-400 shadow-emerald-500/20 hover:shadow-emerald-500/30"
                  }`}
                >
                  {loading
                    ? "Sending reset link..."
                    : "Send Reset Link"}

                  {!loading && (
                    <ArrowRight
                      size={18}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  )}
                </button>

              </form>

              {/* SECURITY */}

              <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={14} />
                Your account information is protected
              </div>

            </>
          ) : (

            /* SUCCESS */

            <div className="py-8 text-center">

              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full shadow-lg ${
                  isAdmin
                    ? "bg-blue-400/10 text-blue-400 shadow-blue-500/10"
                    : "bg-emerald-400/10 text-emerald-400 shadow-emerald-500/10"
                }`}
              >
                <CheckCircle2 size={34} />
              </div>

              <h2 className="mt-6 text-3xl font-bold tracking-tight">
                Check your email
              </h2>

              <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-400">
                A password reset link has been sent to{" "}
                <span
                  className={
                    isAdmin
                      ? "font-medium text-blue-300"
                      : "font-medium text-emerald-300"
                  }
                >
                  {email}
                </span>
                .
              </p>

              <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left">

                <p className="text-xs font-medium text-slate-300">
                  What to do next
                </p>

                <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-500">

                  <li>
                    Check your inbox for the reset email.
                  </li>

                  <li>
                    Check your spam or junk folder.
                  </li>

                  <li>
                    Open the reset link to create a new password.
                  </li>

                </ul>

              </div>

              <Link
                href={loginUrl}
                className={`mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-lg transition hover:-translate-y-0.5 ${
                  isAdmin
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/20 hover:shadow-blue-500/30"
                    : "bg-gradient-to-r from-emerald-400 to-teal-400 shadow-emerald-500/20 hover:shadow-emerald-500/30"
                }`}
              >
                Return to {portalName}
                <ArrowRight size={18} />
              </Link>

            </div>
          )}

          {/* FOOTER */}

          <div className="mt-8 border-t border-white/10 pt-6 text-center">

            <Link
              href={loginUrl}
              className={`text-sm text-slate-500 transition ${
                isAdmin
                  ? "hover:text-blue-300"
                  : "hover:text-emerald-300"
              }`}
            >
              ← Return to {portalName}
            </Link>

          </div>

        </div>

      </div>

    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#061510]" />
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}