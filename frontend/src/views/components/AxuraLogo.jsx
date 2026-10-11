import React from "react";
import { Link } from "react-router-dom";

/**
 * AxuraLogo - High-end modern brand emblem & wordmark for AxuraShop
 * Supports sizes: 'sm' | 'md' | 'lg' | 'xl'
 * Supports themes: 'light' (for dark headers/footers) | 'dark' (for light store backgrounds)
 */
const AxuraLogo = ({ size = "md", theme = "dark", to = "/", showSubtitle = true, className = "" }) => {
  // Dimensions map
  const sizeConfig = {
    sm: {
      box: "w-8 h-8",
      svg: 32,
      title: "text-lg",
      badge: "text-[8px] px-1 py-0.2",
      sub: "text-[8px]",
    },
    md: {
      box: "w-10 h-10 sm:w-11 sm:h-11",
      svg: 42,
      title: "text-xl sm:text-2xl",
      badge: "text-[9px] px-1.5 py-0.5",
      sub: "text-[9px] sm:text-[10px]",
    },
    lg: {
      box: "w-12 h-12 sm:w-14 sm:h-14",
      svg: 52,
      title: "text-2xl sm:text-3xl",
      badge: "text-[10px] px-2 py-0.5",
      sub: "text-[11px]",
    },
    xl: {
      box: "w-16 h-16",
      svg: 64,
      title: "text-3xl sm:text-4xl",
      badge: "text-xs px-2.5 py-1",
      sub: "text-xs",
    },
  };

  const cfg = sizeConfig[size] || sizeConfig.md;
  const isLight = theme === "light"; // rendered on dark backgrounds (e.g. footer)

  const content = (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 group select-none ${className}`}>
      {/* Dynamic Geometric Brand Icon */}
      <div className={`relative ${cfg.box} rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-sky-400 p-[1.5px] shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 group-hover:scale-105 group-hover:rotate-1 transition-all duration-300 shrink-0`}>
        {/* Inner Glass Core */}
        <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center relative overflow-hidden">
          {/* Subtle Glow Beam */}
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-sky-400/40 rounded-full blur-md group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
          <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-indigo-600/40 rounded-full blur-md group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

          {/* Precision SVG Monogram: Futuristic "A" + Shopping Diamond */}
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-3/4 h-3/4 transform group-hover:scale-110 transition-transform duration-300"
          >
            <defs>
              <linearGradient id="axuraA1" x1="6" y1="42" x2="24" y2="6" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="0.5" stopColor="#818cf8" />
                <stop offset="1" stopColor="#c084fc" />
              </linearGradient>
              <linearGradient id="axuraA2" x1="24" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
                <stop stopColor="#c084fc" />
                <stop offset="0.6" stopColor="#6366f1" />
                <stop offset="1" stopColor="#4f46e5" />
              </linearGradient>
              <linearGradient id="axuraStar" x1="18" y1="18" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffffff" />
                <stop offset="1" stopColor="#38bdf8" />
              </linearGradient>
            </defs>

            {/* Left Wing of "A" */}
            <path
              d="M10 40L24 8L29 18L18 38L10 40Z"
              fill="url(#axuraA1)"
            />

            {/* Right Wing of "A" */}
            <path
              d="M38 40L24 8L20 16L31 38L38 40Z"
              fill="url(#axuraA2)"
            />

            {/* Crossbar Nexus */}
            <path
              d="M15 28H33L30 33H18L15 28Z"
              fill="url(#axuraA2)"
              opacity="0.9"
            />

            {/* Central Diamond Sparkle Accent */}
            <path
              d="M24 19L26 24L31 24L27 27L29 32L24 29L19 32L21 27L17 24L22 24L24 19Z"
              fill="url(#axuraStar)"
              className="animate-pulse"
            />
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-black tracking-tight ${cfg.title} ${
              isLight
                ? "text-white"
                : "bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 bg-clip-text text-transparent"
            }`}
          >
            Axura
          </span>
          <span
            className={`font-black tracking-tight ${cfg.title} bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-500 bg-clip-text text-transparent`}
          >
            Shop
          </span>
          <span
            className={`${cfg.badge} rounded-md font-extrabold uppercase tracking-wider ${
              isLight
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-400/30"
                : "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
            }`}
          >
            Pro
          </span>
        </div>

        {showSubtitle && (
          <span
            className={`font-bold uppercase tracking-[0.2em] -mt-0.5 sm:mt-0.5 hidden sm:block ${cfg.sub} ${
              isLight ? "text-slate-400" : "text-slate-400"
            }`}
          >
            Next-Gen Commerce
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="text-decoration-none group inline-block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};

export default AxuraLogo;
