"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
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
   * =========================================================
   * API
   * =========================================================
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
   * SEND RESET LINK
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
    <main
      className={`relative min-h-screen overflow-hidden text-white ${
        isAdmin
          ? "bg-[#050c1a]"
          : "bg-[#061510]"
      }`}
    >
      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div
        className={`absolute inset-0 ${
          isAdmin
            ? "bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.20),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(99,102,241,0.22),transparent_32%),linear-gradient(135deg,#050d1c,#07162b_45%,#11162e)]"
            : "bg-[radial-gradient(circle_at_15%_20%,rgba(75,200,150,0.18),transparent_30%),radial-gradient(circle_at_85%_75%,rgba(90,90,180,0.18),transparent_30%),linear-gradient(135deg,#061510,#071b18_45%,#101426)]"
        }`}
      />

      {/* =====================================================
          GRID
      ====================================================== */}

      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:48px_48px]" />

      {/* =====================================================
          BACKGROUND GLOWS
      ====================================================== */}

      <div
        className={`absolute -left-32 top-10 h-[420px] w-[420px] rounded-full blur-[120px] ${
          isAdmin
            ? "bg-blue-500/10"
            : "bg-emerald-500/10"
        }`}
      />

      <div
        className={`absolute -right-32 bottom-0 h-[500px] w-[500px] rounded-full blur-[130px] ${
          isAdmin
            ? "bg-indigo-500/15"
            : "bg-teal-500/10"
        }`}
      />

      {/* =====================================================
          FLOATING LIGHTS
      ====================================================== */}

      <div
        className={`absolute left-[12%] top-[25%] h-3 w-3 animate-pulse rounded-full ${
          isAdmin
            ? "bg-blue-300 shadow-[0_0_25px_rgba(147,197,253,0.9)]"
            : "bg-emerald-300 shadow-[0_0_25px_rgba(110,231,183,0.8)]"
        }`}
      />

      <div
        className={`absolute right-[15%] top-[35%] h-3 w-3 animate-pulse rounded-full ${
          isAdmin
            ? "bg-indigo-300 shadow-[0_0_25px_rgba(165,180,252,0.9)]"
            : "bg-teal-300 shadow-[0_0_25px_rgba(94,234,212,0.8)]"
        }`}
      />

      <div
        className={`absolute bottom-[28%] right-[11%] h-2.5 w-2.5 animate-pulse rounded-full ${
          isAdmin
            ? "bg-violet-300 shadow-[0_0_20px_rgba(196,181,253,0.9)]"
            : "bg-emerald-300 shadow-[0_0_20px_rgba(110,231,183,0.7)]"
        }`}
      />

      {/* =====================================================
          MAIN AREA
      ====================================================== */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12 sm:px-8">

        {/* ===================================================
            OUTER GLOW
        ==================================================== */}

        <div
          className={`absolute h-[650px] w-[650px] rounded-[40px] opacity-30 blur-[100px] ${
            isAdmin
              ? "bg-gradient-to-r from-blue-600/20 via-indigo-500/20 to-violet-600/20"
              : "bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-cyan-500/15"
          }`}
        />

        {/* ===================================================
            ANIMATED BORDER WRAPPER
        ==================================================== */}

        <div
          className={`group relative w-full max-w-3xl rounded-[32px] p-[1px] transition-all duration-500 hover:-translate-y-1 ${
            isAdmin
              ? "bg-gradient-to-br from-blue-400/50 via-indigo-500/20 to-violet-500/50 shadow-[0_0_80px_rgba(59,130,246,0.10)] hover:shadow-[0_0_100px_rgba(59,130,246,0.22)]"
              : "bg-gradient-to-br from-emerald-400/40 via-teal-500/20 to-cyan-400/40 shadow-[0_0_80px_rgba(16,185,129,0.10)] hover:shadow-[0_0_100px_rgba(16,185,129,0.20)]"
          }`}
        >

          {/* =================================================
              MOVING SHINE
          ================================================== */}

          <div className="pointer-events-none absolute -inset-[1px] overflow-hidden rounded-[32px] opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="absolute -left-[100%] top-0 h-full w-[60%] rotate-[15deg] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent blur-xl transition-transform duration-[1400ms] group-hover:translate-x-[300%]" />
          </div>

          {/* =================================================
              CARD
          ================================================== */}

          <div
            className={`relative overflow-hidden rounded-[31px] p-8 backdrop-blur-2xl sm:p-10 md:p-12 ${
              isAdmin
                ? "bg-[#07101f]/95"
                : "bg-[#071510]/95"
            }`}
          >

            {/* INNER TOP GLOW */}

            <div
              className={`pointer-events-none absolute left-1/2 top-0 h-32 w-[70%] -translate-x-1/2 rounded-full blur-[70px] ${
                isAdmin
                  ? "bg-blue-500/10"
                  : "bg-emerald-500/10"
              }`}
            />

            {/* INNER BORDER */}

            <div
              className={`pointer-events-none absolute inset-0 rounded-[31px] border ${
                isAdmin
                  ? "border-white/[0.08]"
                  : "border-white/[0.06]"
              }`}
            />

            {/* =================================================
                CONTENT
            ================================================== */}

            <div className="relative z-10">

              {/* =================================================
                  BRAND
              ================================================== */}

              <div className="flex items-center gap-5">

                <div
                  className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-xl transition-all duration-500 group-hover:scale-105 ${
                    isAdmin
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25"
                      : "bg-gradient-to-br from-emerald-400 to-teal-400 text-slate-950 shadow-emerald-500/20"
                  }`}
                >

                  <div
                    className={`absolute inset-0 rounded-2xl blur-md opacity-40 ${
                      isAdmin
                        ? "bg-blue-500"
                        : "bg-emerald-400"
                    }`}
                  />

                  <GraduationCap
                    size={31}
                    className="relative z-10"
                  />

                </div>

                <div>

                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    CampusConnect
                  </h1>

                  <p className="mt-1 text-sm text-slate-400 sm:text-base">
                    Smart Campus Management
                  </p>

                </div>

              </div>

              {/* =================================================
                  DIVIDER
              ================================================== */}

              <div className="my-9 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent sm:my-10" />

              {!success ? (
                <>
                  {/* ===========================================
                      HEADER
                  ============================================ */}

                  <div className="mb-9">

                    <div
                      className={`mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium shadow-lg ${
                        isAdmin
                          ? "border-blue-400/25 bg-blue-500/10 text-blue-300 shadow-blue-500/5"
                          : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300 shadow-emerald-500/5"
                      }`}
                    >
                      <ShieldCheck size={15} />

                      {isAdmin
                        ? "Secure admin account recovery"
                        : "Secure student account recovery"}
                    </div>

                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                      Forgot your{" "}
                      <span
                        className={
                          isAdmin
                            ? "text-blue-400"
                            : "text-emerald-400"
                        }
                      >
                        password?
                      </span>
                    </h2>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                      Enter the email address connected to your
                      CampusConnect{" "}
                      {portalName.toLowerCase()}.
                      {" "}
                      We will send you a secure password reset link.
                    </p>

                  </div>

                  {/* ===========================================
                      ERROR
                  ============================================ */}

                  {error && (
                    <div className="mb-7 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3.5 text-sm text-red-300 shadow-lg shadow-red-950/10">
                      {error}
                    </div>
                  )}

                  {/* ===========================================
                      FORM
                  ============================================ */}

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-7"
                  >

                    <div>

                      <label
                        htmlFor="email"
                        className="mb-3 block text-sm font-semibold text-slate-200"
                      >
                        {isAdmin
                          ? "Admin email address"
                          : "Student email address"}
                      </label>

                      <div className="relative">

                        <Mail
                          size={20}
                          className="absolute left-5 top-1/2 z-10 -translate-y-1/2 text-slate-500 transition-colors"
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
                          className={`w-full rounded-xl border bg-white/[0.035] py-4 pl-14 pr-5 text-sm text-white outline-none transition-all duration-300 ${
                            isAdmin
                              ? "border-white/15 focus:border-blue-400/60 focus:bg-blue-500/[0.035] focus:ring-4 focus:ring-blue-500/[0.08]"
                              : "border-white/10 focus:border-emerald-400/60 focus:bg-emerald-500/[0.035] focus:ring-4 focus:ring-emerald-500/[0.08]"
                          } disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-slate-600`}
                        />

                      </div>

                    </div>

                    {/* =========================================
                        BUTTON
                    ========================================== */}

                    <button
                      type="submit"
                      disabled={loading}
                      className={`group/button relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-4 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${
                        isAdmin
                          ? "bg-gradient-to-r from-blue-500 via-blue-500 to-indigo-600 shadow-blue-500/20 hover:shadow-[0_10px_40px_rgba(59,130,246,0.30)]"
                          : "bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-emerald-500/20 hover:shadow-[0_10px_40px_rgba(16,185,129,0.25)]"
                      }`}
                    >

                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/button:translate-x-full" />

                      <span className="relative z-10">
                        {loading
                          ? "Sending reset link..."
                          : "Send Reset Link"}
                      </span>

                      {!loading && (
                        <ArrowRight
                          size={19}
                          className="relative z-10 transition-transform duration-300 group-hover/button:translate-x-1"
                        />
                      )}

                    </button>

                  </form>

                  {/* ===========================================
                      SECURITY
                  ============================================ */}

                  <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <ShieldCheck size={14} />
                    Your account information is protected
                  </div>
                </>
              ) : (

                /* =================================================
                   SUCCESS
                ================================================== */

                <div className="py-6 text-center sm:py-8">

                  {/* =========================================
                      SUCCESS ICON
                  ========================================== */}

                  <div
                    className={`relative mx-auto flex h-24 w-24 items-center justify-center rounded-full ${
                      isAdmin
                        ? "text-blue-300"
                        : "text-emerald-300"
                    }`}
                  >

                    {/* Outer glow */}

                    <div
                      className={`absolute inset-0 rounded-full blur-2xl ${
                        isAdmin
                          ? "bg-blue-500/20"
                          : "bg-emerald-500/20"
                      }`}
                    />

                    {/* Outer ring */}

                    <div
                      className={`absolute inset-1 rounded-full border ${
                        isAdmin
                          ? "border-blue-400/25"
                          : "border-emerald-400/25"
                      }`}
                    />

                    {/* Inner ring */}

                    <div
                      className={`absolute inset-4 rounded-full border ${
                        isAdmin
                          ? "border-blue-400/40 bg-blue-500/[0.08]"
                          : "border-emerald-400/40 bg-emerald-500/[0.08]"
                      }`}
                    />

                    <CheckCircle2
                      size={38}
                      strokeWidth={1.8}
                      className="relative z-10"
                    />

                  </div>

                  {/* =========================================
                      SUCCESS HEADING
                  ========================================== */}

                  <h2 className="mt-7 text-3xl font-bold tracking-tight sm:text-4xl">
                    Check your{" "}
                    <span
                      className={
                        isAdmin
                          ? "text-blue-400"
                          : "text-emerald-400"
                      }
                    >
                      email
                    </span>
                  </h2>

                  {/* =========================================
                      SUCCESS DESCRIPTION
                  ========================================== */}

                  <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">

                    A password reset link has been sent to{" "}

                    <span
                      className={
                        isAdmin
                          ? "font-semibold text-blue-300"
                          : "font-semibold text-emerald-300"
                      }
                    >
                      {email}
                    </span>
                    .

                  </p>

                  {/* =========================================
                      WHAT TO DO NEXT
                  ========================================== */}

                  <div
                    className={`mx-auto mt-9 max-w-xl rounded-2xl border p-6 text-left shadow-inner ${
                      isAdmin
                        ? "border-white/10 bg-white/[0.035]"
                        : "border-white/10 bg-white/[0.025]"
                    }`}
                  >

                    <p className="text-sm font-semibold text-slate-200">
                      What to do next
                    </p>

                    <div className="mt-5 space-y-4">

                      {/* Inbox */}

                      <div className="flex items-start gap-3">

                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            isAdmin
                              ? "bg-blue-500/10 text-blue-300"
                              : "bg-emerald-500/10 text-emerald-300"
                          }`}
                        >
                          <Mail size={14} />
                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                          Check your admin email inbox for the
                          password reset message.
                        </p>

                      </div>

                      {/* Spam */}

                      <div className="flex items-start gap-3">

                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            isAdmin
                              ? "bg-indigo-500/10 text-indigo-300"
                              : "bg-teal-500/10 text-teal-300"
                          }`}
                        >
                          <ShieldCheck size={14} />
                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                          If you do not see it, check your spam
                          or junk folder.
                        </p>

                      </div>

                      {/* Reset */}

                      <div className="flex items-start gap-3">

                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            isAdmin
                              ? "bg-violet-500/10 text-violet-300"
                              : "bg-cyan-500/10 text-cyan-300"
                          }`}
                        >
                          <ArrowLeft size={14} />
                        </div>

                        <p className="text-sm leading-6 text-slate-400">
                          Open the reset link in the email to
                          create your new password.
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* =========================================
                      RETURN BUTTON
                  ========================================== */}

                  <Link
                    href={loginUrl}
                    className={`group/return mt-9 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 ${
                      isAdmin
                        ? "bg-gradient-to-r from-blue-500 via-blue-500 to-indigo-600 shadow-blue-500/20 hover:shadow-[0_10px_40px_rgba(59,130,246,0.30)]"
                        : "bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-emerald-500/20 hover:shadow-[0_10px_40px_rgba(16,185,129,0.25)]"
                    }`}
                  >

                    Return to {portalName}

                    <ArrowRight
                      size={18}
                      className="transition-transform duration-300 group-hover/return:translate-x-1"
                    />

                  </Link>

                  {/* =========================================
                      SECURITY MESSAGE
                  ========================================== */}

                  <div className="mt-9 flex items-center justify-center gap-2 text-xs text-slate-500">

                    <ShieldCheck
                      size={14}
                      className={
                        isAdmin
                          ? "text-blue-400/70"
                          : "text-emerald-400/70"
                      }
                    />

                    {isAdmin
                      ? "Your admin account information is protected"
                      : "Your student account information is protected"}

                  </div>

                </div>
              )}

              {/* =================================================
                  FOOTER
              ================================================== */}

              <div className="mt-9 border-t border-white/10 pt-7 text-center">

                <Link
                  href={loginUrl}
                  className={`inline-flex items-center gap-2 text-sm text-slate-500 transition-colors ${
                    isAdmin
                      ? "hover:text-blue-300"
                      : "hover:text-emerald-300"
                  }`}
                >
                  <ArrowLeft size={15} />
                  Return to {portalName}
                </Link>

              </div>

            </div>

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
        <main className="min-h-screen bg-[#050c1a]" />
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}