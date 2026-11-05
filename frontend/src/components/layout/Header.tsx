"use client";

import React from "react";
import { Activity, Moon, Sun, Cpu, Sparkles, BookOpen } from "lucide-react";

interface HeaderProps {
  currentTab: string;
  isDark: boolean;
  setIsDark: (val: boolean) => void;
  backendHealthy: boolean;
  totalErrors: number;
}

export function Header({
  currentTab,
  isDark,
  setIsDark,
  backendHealthy,
  totalErrors,
}: HeaderProps) {
  const titles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Overview Dashboard",
      subtitle: "Executive metrics and theoretical analysis distribution",
    },
    editor: {
      title: "Interactive Document Editor",
      subtitle: "Rich text editing with real-time regex highlighting and conflict-free correction",
    },
    errors: {
      title: "Error Detection & Breakdown",
      subtitle: "Detailed taxonomy of the 6 formal grammatical and formatting error categories",
    },
    patterns: {
      title: "Regex Pattern Explorer",
      subtitle: "Mathematical formulations, PCRE flags, lookaround assertions, and limitations",
    },
    dfa: {
      title: "Deterministic Finite Automata Lab",
      subtitle: "Formal 5-tuple M=(Q, Σ, δ, q0, F) interactive visualizer and stream scanner",
    },
    performance: {
      title: "RE vs DFA Performance Lab",
      subtitle: "Empirical nanosecond benchmarking across 1KB–1MB and software metrics",
    },
    testing: {
      title: "Automated Test Suite & Validation",
      subtitle: "18 comprehensive verification scenarios ensuring 100% formal correctness",
    },
    export: {
      title: "Academic Report & Export Hub",
      subtitle: "Theory of computation 10-section case study document and data exports",
    },
  };

  const current = titles[currentTab] || titles.dashboard;

  return (
    <header className="h-20 border-b border-border-subtle bg-panel/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-electric-600 dark:text-electric-400 bg-electric-500/10 px-2.5 py-0.5 rounded-full border border-electric-500/20">
            Theory of Computation
          </span>
          <span className="text-xs text-content-muted">•</span>
          <span className="text-xs text-content-secondary font-mono">Academic Viva Demonstration</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-content-primary flex items-center gap-2 mt-0.5">
          {current.title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend health status badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-panel-subtle border border-border-subtle text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              backendHealthy ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}
          />
          <span className="text-content-secondary font-medium">
            {backendHealthy ? "FastAPI Connected" : "Connecting..."}
          </span>
        </div>

        {/* Total errors badge */}
        {totalErrors > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>{totalErrors} Active Errors</span>
          </div>
        )}

        {/* Dark/Light toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2.5 rounded-xl bg-panel-subtle border border-border-subtle hover:border-border-muted text-content-secondary hover:text-content-primary transition-all shadow-sm"
          title={isDark ? "Switch to Crisp Light Theme" : "Switch to Deep Dark Theme"}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-electric-600 hover:-rotate-12 transition-transform" />
          )}
        </button>
      </div>
    </header>
  );
}
