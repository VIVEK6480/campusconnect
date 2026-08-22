"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Building2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
  BookOpen,
  UserRoundCog,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020508] text-white">

      {/* =====================================================
          PREMIUM BACKGROUND
      ===================================================== */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        {/* Deep cinematic base */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,#153c32_0%,#0a1c18_24%,#04100e_48%,#020508_78%,#010304_100%)]" />

        {/* Large emerald atmosphere */}
        <div className="aurora aurora-green absolute -left-[18%] -top-[20%] h-[700px] w-[700px] rounded-full bg-emerald-500/[0.13] blur-[150px]" />

        {/* Cyan atmosphere */}
        <div className="aurora aurora-cyan absolute -right-[18%] top-[4%] h-[650px] w-[650px] rounded-full bg-cyan-400/[0.10] blur-[150px]" />

        {/* Blue atmosphere */}
        <div className="aurora aurora-blue absolute -bottom-[25%] left-[18%] h-[750px] w-[750px] rounded-full bg-blue-600/[0.09] blur-[170px]" />

        {/* Violet atmosphere */}
        <div className="aurora aurora-violet absolute right-[5%] bottom-[2%] h-[520px] w-[520px] rounded-full bg-violet-500/[0.07] blur-[150px]" />

        {/* =================================================
            PREMIUM MOVING GRID
        ================================================== */}
        <div
          className="moving-grid absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(
                rgba(255,255,255,0.75) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(255,255,255,0.75) 1px,
                transparent 1px
              )
            `,
            backgroundSize: "64px 64px",
          }}
        />

        {/* =================================================
            HORIZONTAL LIGHT LAYERS
        ================================================== */}
        <div className="ambient-line ambient-line-1 absolute left-[-20%] top-[18%] h-px w-[70%] bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent" />

        <div className="ambient-line ambient-line-2 absolute right-[-20%] top-[52%] h-px w-[65%] bg-gradient-to-r from-transparent via-cyan-300/15 to-transparent" />

        <div className="ambient-line ambient-line-3 absolute left-[-20%] bottom-[18%] h-px w-[60%] bg-gradient-to-r from-transparent via-blue-300/15 to-transparent" />

        {/* =================================================
            ORBITAL RINGS
        ================================================== */}
        <div className="orbit orbit-one absolute left-[5%] top-[15%] h-[420px] w-[420px] rounded-full border border-emerald-300/[0.055]" />

        <div className="orbit orbit-two absolute right-[4%] top-[24%] h-[500px] w-[500px] rounded-full border border-cyan-300/[0.045]" />

        <div className="orbit orbit-three absolute left-[36%] bottom-[-5%] h-[430px] w-[430px] rounded-full border border-violet-300/[0.04]" />

        {/* Orbital highlights */}
        <div className="orbit-dot absolute left-[11%] top-[19%] h-2 w-2 rounded-full bg-emerald-300/70 shadow-[0_0_25px_8px_rgba(52,211,153,0.18)]" />

        <div className="orbit-dot-two absolute right-[11%] top-[31%] h-1.5 w-1.5 rounded-full bg-cyan-300/70 shadow-[0_0_25px_8px_rgba(103,232,249,0.16)]" />

        <div className="orbit-dot-three absolute left-[47%] bottom-[9%] h-1.5 w-1.5 rounded-full bg-violet-300/60 shadow-[0_0_25px_8px_rgba(196,181,253,0.13)]" />

        {/* =================================================
            FLOATING PARTICLES
        ================================================== */}
        <div className="floating-particle particle-a absolute left-[10%] top-[35%] h-1.5 w-1.5 rounded-full bg-emerald-300/80 shadow-[0_0_18px_5px_rgba(52,211,153,0.16)]" />

        <div className="floating-particle particle-b absolute left-[23%] top-[14%] h-1 w-1 rounded-full bg-cyan-300/80 shadow-[0_0_18px_5px_rgba(103,232,249,0.14)]" />

        <div className="floating-particle particle-c absolute left-[42%] top-[25%] h-1 w-1 rounded-full bg-blue-300/70 shadow-[0_0_18px_5px_rgba(96,165,250,0.13)]" />

        <div className="floating-particle particle-d absolute right-[15%] top-[22%] h-1.5 w-1.5 rounded-full bg-cyan-300/75 shadow-[0_0_18px_5px_rgba(103,232,249,0.14)]" />

        <div className="floating-particle particle-e absolute right-[27%] top-[59%] h-1 w-1 rounded-full bg-violet-300/70 shadow-[0_0_18px_5px_rgba(196,181,253,0.13)]" />

        <div className="floating-particle particle-f absolute left-[17%] bottom-[20%] h-1.5 w-1.5 rounded-full bg-emerald-300/70 shadow-[0_0_18px_5px_rgba(52,211,153,0.13)]" />

        <div className="floating-particle particle-g absolute left-[55%] bottom-[13%] h-1 w-1 rounded-full bg-cyan-300/70 shadow-[0_0_18px_5px_rgba(103,232,249,0.13)]" />

        <div className="floating-particle particle-h absolute right-[10%] bottom-[18%] h-1.5 w-1.5 rounded-full bg-blue-300/70 shadow-[0_0_18px_5px_rgba(96,165,250,0.13)]" />

        {/* =================================================
            CENTER LIGHT
        ================================================== */}
        <div className="absolute left-1/2 top-[42%] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-400/[0.025] blur-[130px]" />

        {/* =================================================
            TOP LIGHT
        ================================================== */}
        <div className="absolute left-1/2 top-[-300px] h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-300/[0.035] blur-[120px]" />

        {/* =================================================
            VIGNETTE
        ================================================== */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.38)_100%)]" />

        {/* =================================================
            SOFT FILM GRAIN
        ================================================== */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: `
              radial-gradient(
                rgba(255,255,255,0.8) 0.5px,
                transparent 0.5px
              )
            `,
            backgroundSize: "5px 5px",
          }}
        />
      </div>

      {/* =====================================================
          ANIMATIONS
      ===================================================== */}
      <style jsx global>{`
        @keyframes auroraGreen {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          25% {
            transform: translate3d(100px, 70px, 0) scale(1.12);
          }

          50% {
            transform: translate3d(50px, 150px, 0) scale(0.94);
          }

          75% {
            transform: translate3d(-80px, 80px, 0) scale(1.08);
          }
        }

        @keyframes auroraCyan {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          30% {
            transform: translate3d(-100px, 90px, 0) scale(1.1);
          }

          60% {
            transform: translate3d(-60px, -80px, 0) scale(0.92);
          }

          85% {
            transform: translate3d(80px, -30px, 0) scale(1.05);
          }
        }

        @keyframes auroraBlue {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          35% {
            transform: translate3d(120px, -70px, 0) scale(1.1);
          }

          70% {
            transform: translate3d(-90px, -50px, 0) scale(0.92);
          }
        }

        @keyframes auroraViolet {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(-100px, -80px, 0) scale(1.13);
          }
        }

        .aurora-green {
          animation: auroraGreen 20s ease-in-out infinite;
        }

        .aurora-cyan {
          animation: auroraCyan 24s ease-in-out infinite;
        }

        .aurora-blue {
          animation: auroraBlue 27s ease-in-out infinite;
        }

        .aurora-violet {
          animation: auroraViolet 22s ease-in-out infinite;
        }

        /* Moving grid */

        @keyframes gridDrift {
          0% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(32px, 32px, 0);
          }

          100% {
            transform: translate3d(64px, 64px, 0);
          }
        }

        .moving-grid {
          animation: gridDrift 24s linear infinite;
        }

        /* Ambient lines */

        @keyframes ambientLine {
          0% {
            transform: translateX(-30%);
            opacity: 0;
          }

          20% {
            opacity: 0.8;
          }

          50% {
            opacity: 1;
          }

          80% {
            opacity: 0.6;
          }

          100% {
            transform: translateX(170%);
            opacity: 0;
          }
        }

        .ambient-line {
          animation: ambientLine 18s linear infinite;
        }

        .ambient-line-2 {
          animation-delay: 6s;
        }

        .ambient-line-3 {
          animation-delay: 12s;
        }

        /* Orbit */

        @keyframes orbitPulse {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.25;
          }

          50% {
            transform: scale(1.07) rotate(4deg);
            opacity: 0.6;
          }
        }

        .orbit-one {
          animation: orbitPulse 15s ease-in-out infinite;
        }

        .orbit-two {
          animation: orbitPulse 19s ease-in-out infinite reverse;
        }

        .orbit-three {
          animation: orbitPulse 22s ease-in-out infinite;
        }

        /* Orbit dots */

        @keyframes orbitDot {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.35;
          }

          50% {
            transform: scale(1.8);
            opacity: 0.9;
          }
        }

        .orbit-dot,
        .orbit-dot-two,
        .orbit-dot-three {
          animation: orbitDot 5s ease-in-out infinite;
        }

        .orbit-dot-two {
          animation-delay: 1.5s;
        }

        .orbit-dot-three {
          animation-delay: 3s;
        }

        /* Particles */

        @keyframes particleFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 0.25;
          }

          25% {
            transform: translate3d(45px, -65px, 0);
            opacity: 0.9;
          }

          50% {
            transform: translate3d(90px, 10px, 0);
            opacity: 0.45;
          }

          75% {
            transform: translate3d(25px, 70px, 0);
            opacity: 0.8;
          }
        }

        @keyframes particleFloatReverse {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 0.2;
          }

          50% {
            transform: translate3d(-65px, -80px, 0);
            opacity: 0.9;
          }
        }

        .floating-particle {
          will-change: transform, opacity;
        }

        .particle-a {
          animation: particleFloat 10s ease-in-out infinite;
        }

        .particle-b {
          animation: particleFloatReverse 13s ease-in-out infinite;
        }

        .particle-c {
          animation: particleFloat 15s ease-in-out infinite reverse;
        }

        .particle-d {
          animation: particleFloatReverse 11s ease-in-out infinite;
        }

        .particle-e {
          animation: particleFloat 14s ease-in-out infinite;
        }

        .particle-f {
          animation: particleFloatReverse 12s ease-in-out infinite reverse;
        }

        .particle-g {
          animation: particleFloat 17s ease-in-out infinite reverse;
        }

        .particle-h {
          animation: particleFloatReverse 14s ease-in-out infinite;
        }

        /* =================================================
           PREMIUM CARD BORDER MOTION
        ================================================= */

        @keyframes borderGlow {
          0%,
          100% {
            opacity: 0.2;
          }

          50% {
            opacity: 0.7;
          }
        }

        .premium-card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(
            120deg,
            transparent 20%,
            rgba(52, 211, 153, 0.25),
            transparent 45%,
            rgba(56, 189, 248, 0.18),
            transparent 70%
          );
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: borderGlow 6s ease-in-out infinite;
        }

        /* =================================================
           CARD SHINE
        ================================================= */

        @keyframes cardShine {
          0% {
            transform: translateX(-130%) rotate(18deg);
          }

          100% {
            transform: translateX(220%) rotate(18deg);
          }
        }

        .card-shine {
          position: absolute;
          top: -50%;
          left: 0;
          width: 25%;
          height: 200%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.035),
            transparent
          );
          transform: translateX(-130%) rotate(18deg);
          transition: opacity 0.3s ease;
        }

        .group:hover .card-shine {
          animation: cardShine 1.4s ease-out;
        }

        /* =================================================
           ICON FLOAT
        ================================================= */

        @keyframes iconFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-3px);
          }
        }

        .portal-icon {
          animation: iconFloat 4s ease-in-out infinite;
        }

        /* =================================================
           REDUCED MOTION
        ================================================= */

        @media (prefers-reduced-motion: reduce) {
          .aurora,
          .moving-grid,
          .ambient-line,
          .orbit,
          .orbit-dot,
          .orbit-dot-two,
          .orbit-dot-three,
          .floating-particle,
          .portal-icon {
            animation: none !important;
          }
        }
      `}</style>

      {/* =====================================================
          CONTENT
      ===================================================== */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-[1450px]">

          {/* =================================================
              HEADER
          ================================================= */}
          <header className="mb-10 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="portal-icon flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/15 bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_10px_40px_rgba(16,185,129,0.22)]">
                <GraduationCap size={27} />
              </div>

              <div>

                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  CampusConnect
                </h1>

                <p className="text-xs font-medium text-slate-300 sm:text-sm">
                  Smart Campus Management
                </p>

              </div>

            </div>

            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-slate-950/65 px-4 py-2 text-xs font-semibold text-slate-200 shadow-xl backdrop-blur-xl sm:flex">
              <ShieldCheck size={15} className="text-emerald-400" />
              Secure Campus Platform
            </div>

          </header>

          {/* =================================================
              HERO
          ================================================= */}
          <section className="mb-10 text-center">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 shadow-[0_10px_40px_rgba(16,185,129,0.08)] backdrop-blur-md sm:text-sm">
              <Sparkles size={15} />
              Welcome to CampusConnect
            </div>

            <h2 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_8px_35px_rgba(0,0,0,0.65)] sm:text-5xl lg:text-6xl">

              Your campus.
              <br />

              <span className="bg-gradient-to-r from-emerald-200 via-teal-200 to-blue-200 bg-clip-text text-transparent">
                One connected platform.
              </span>

            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-7 text-slate-300 drop-shadow-lg sm:text-base">
              Access clubs, events, activities, announcements and campus
              services from one modern platform.
            </p>

          </section>

          {/* =================================================
              THREE PORTALS
          ================================================= */}
          <section className="grid gap-5 lg:grid-cols-3">

            {/* =================================================
                STUDENT
            ================================================= */}
            <div className="premium-card group relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950/85 via-[#0d1918]/95 to-[#050c0b]/95 p-7 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-all duration-500 hover:-translate-y-2 hover:border-emerald-300/40 hover:shadow-[0_30px_100px_rgba(16,185,129,0.12)]">

              <div className="card-shine pointer-events-none" />

              <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-emerald-400/[0.07] blur-3xl transition-all duration-700 group-hover:bg-emerald-400/[0.14]" />

              <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-teal-500/[0.045] blur-3xl" />

              <div className="relative z-10">

                <div className="portal-icon mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/15 bg-gradient-to-br from-emerald-500 to-teal-500 shadow-[0_12px_35px_rgba(16,185,129,0.22)]">
                  <GraduationCap size={28} />
                </div>

                <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                  Student Portal
                </div>

                <h3 className="text-2xl font-bold text-white">
                  Welcome, Student
                </h3>

                <p className="mt-3 min-h-[72px] text-sm font-medium leading-6 text-slate-300">
                  Sign in to manage your campus activities, clubs, events,
                  memberships and notifications.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-emerald-400/20 hover:bg-emerald-400/[0.06]">
                    <Users size={16} className="text-emerald-400" />
                    Clubs
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-teal-400/20 hover:bg-teal-400/[0.06]">
                    <CalendarDays size={16} className="text-teal-400" />
                    Events
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-blue-400/20 hover:bg-blue-400/[0.06]">
                    <BookOpen size={16} className="text-blue-400" />
                    Activities
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-violet-400/20 hover:bg-violet-400/[0.06]">
                    <Sparkles size={16} className="text-violet-400" />
                    Updates
                  </div>

                </div>

                <Link
                  href="/auth/login"
                  className="group/button mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 text-sm font-bold text-white shadow-[0_12px_35px_rgba(16,185,129,0.2)] transition-all duration-300 hover:from-emerald-400 hover:to-teal-400 hover:shadow-[0_15px_45px_rgba(16,185,129,0.28)]"
                >
                  Student Login

                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover/button:translate-x-1"
                  />
                </Link>

                <p className="mt-3 text-center text-xs font-medium text-slate-400">
                  Student accounts only
                </p>

              </div>
            </div>

            {/* =================================================
                ADMIN
            ================================================= */}
            <div className="premium-card group relative overflow-hidden rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-950/85 via-[#0d1524]/95 to-[#050912]/95 p-7 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-all duration-500 hover:-translate-y-2 hover:border-blue-300/40 hover:shadow-[0_30px_100px_rgba(59,130,246,0.12)]">

              <div className="card-shine pointer-events-none" />

              <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-blue-400/[0.07] blur-3xl transition-all duration-700 group-hover:bg-blue-400/[0.14]" />

              <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-indigo-500/[0.045] blur-3xl" />

              <div className="relative z-10">

                <div className="portal-icon mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_12px_35px_rgba(59,130,246,0.22)]">
                  <ShieldCheck size={27} />
                </div>

                <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                  Administration
                </div>

                <h3 className="text-2xl font-bold text-white">
                  Admin Portal
                </h3>

                <p className="mt-3 min-h-[72px] text-sm font-medium leading-6 text-slate-300">
                  Authorized administrators can manage users, clubs, events,
                  announcements and the complete CampusConnect platform.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-blue-400/20 hover:bg-blue-400/[0.06]">
                    <Users size={16} className="text-blue-400" />
                    Users
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-indigo-400/20 hover:bg-indigo-400/[0.06]">
                    <Building2 size={16} className="text-indigo-400" />
                    Clubs
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-violet-400/20 hover:bg-violet-400/[0.06]">
                    <CalendarDays size={16} className="text-violet-400" />
                    Events
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-emerald-400/20 hover:bg-emerald-400/[0.06]">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    Security
                  </div>

                </div>

                <Link
                  href="/admin/login"
                  className="group/button mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-400/25 bg-blue-500/10 px-5 text-sm font-bold text-blue-200 backdrop-blur-md transition-all duration-300 hover:border-blue-300/45 hover:bg-blue-500/20 hover:text-white hover:shadow-[0_12px_40px_rgba(59,130,246,0.12)]"
                >
                  Login as Admin

                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover/button:translate-x-1"
                  />
                </Link>

                <p className="mt-3 text-center text-xs font-medium text-slate-400">
                  Authorized administration access only
                </p>

              </div>
            </div>

            {/* =================================================
                FACULTY
            ================================================= */}
            <div className="premium-card group relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#12232b]/95 via-[#15242c]/95 to-[#071116]/95 p-7 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-all duration-500 hover:-translate-y-2 hover:border-cyan-300/45 hover:shadow-[0_30px_100px_rgba(6,182,212,0.12)]">

              <div className="card-shine pointer-events-none" />

              <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-400/[0.07] blur-3xl transition-all duration-700 group-hover:bg-cyan-400/[0.14]" />

              <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-sky-500/[0.045] blur-3xl" />

              <div className="relative z-10">

                <div className="portal-icon mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500 to-sky-600 shadow-[0_12px_35px_rgba(6,182,212,0.22)]">
                  <UserRoundCog size={27} />
                </div>

                <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
                  Faculty Portal
                </div>

                <h3 className="text-2xl font-bold text-white">
                  Welcome, Faculty
                </h3>

                <p className="mt-3 min-h-[72px] text-sm font-medium leading-6 text-slate-200">
                  Faculty members can manage academic activities, students,
                  clubs, events and campus-related responsibilities.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">

                  <div className="flex items-center gap-2 rounded-xl border border-cyan-300/10 bg-[#182b34]/75 px-3 py-3 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-cyan-300/25 hover:bg-cyan-400/[0.07]">
                    <Users size={16} className="text-cyan-300" />
                    Students
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-cyan-300/10 bg-[#182b34]/75 px-3 py-3 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-sky-300/25 hover:bg-sky-400/[0.07]">
                    <BookOpen size={16} className="text-sky-300" />
                    Academics
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-cyan-300/10 bg-[#182b34]/75 px-3 py-3 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-cyan-300/25 hover:bg-cyan-400/[0.07]">
                    <CalendarDays size={16} className="text-cyan-300" />
                    Events
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-cyan-300/10 bg-[#182b34]/75 px-3 py-3 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-sky-300/25 hover:bg-sky-400/[0.07]">
                    <Building2 size={16} className="text-sky-300" />
                    Clubs
                  </div>

                </div>

                <Link
                  href="/faculty/login"
                  className="group/button mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-gradient-to-r from-cyan-500/10 to-sky-500/10 px-5 text-sm font-bold text-cyan-100 backdrop-blur-md transition-all duration-300 hover:border-cyan-300/50 hover:from-cyan-500/20 hover:to-sky-500/20 hover:text-white hover:shadow-[0_12px_40px_rgba(6,182,212,0.12)]"
                >
                  Login as Faculty

                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover/button:translate-x-1"
                  />
                </Link>

                <p className="mt-3 text-center text-xs font-medium text-slate-400">
                  Authorized faculty access only
                </p>

              </div>
            </div>

          </section>

          {/* =================================================
              BOTTOM FEATURES
          ================================================= */}
          <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

            <div className="group flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs font-semibold text-slate-300 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-400/20 hover:bg-emerald-400/[0.04]">
              <Building2
                size={15}
                className="text-emerald-400 transition-transform duration-300 group-hover:scale-110"
              />
              Club Management
            </div>

            <div className="group flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs font-semibold text-slate-300 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-blue-400/20 hover:bg-blue-400/[0.04]">
              <CalendarDays
                size={15}
                className="text-blue-400 transition-transform duration-300 group-hover:scale-110"
              />
              Event Management
            </div>

            <div className="group flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-xs font-semibold text-slate-300 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-violet-400/20 hover:bg-violet-400/[0.04]">
              <ShieldCheck
                size={15}
                className="text-violet-400 transition-transform duration-300 group-hover:scale-110"
              />
              Secure Access
            </div>

          </section>

          {/* =================================================
              FOOTER
          ================================================= */}
          <footer className="mt-6 text-center">

            <p className="text-xs font-medium text-slate-400">
              © {new Date().getFullYear()} CampusConnect
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Smart Campus Management Platform
            </p>

            <p className="mt-3 text-sm font-bold text-slate-300">
              ❤️ Vivek Kumar
            </p>

          </footer>

        </div>
      </div>
    </main>
  );
}