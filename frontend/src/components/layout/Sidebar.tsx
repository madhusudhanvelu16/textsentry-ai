"use client";

import React from "react";
import {
  LayoutDashboard,
  Edit3,
  AlertTriangle,
  Code2,
  Cpu,
  BarChart3,
  CheckCircle2,
  FileDown,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  totalErrors: number;
}

export function Sidebar({ currentTab, setCurrentTab, totalErrors }: SidebarProps) {
  const navItems = [
    {
      id: "dashboard",
      label: "Overview Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "editor",
      label: "Interactive Editor",
      icon: Edit3,
      badge: totalErrors > 0 ? `${totalErrors}` : null,
      badgeColor: "bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30",
    },
    {
      id: "errors",
      label: "Error Breakdown",
      icon: AlertTriangle,
      badge: "6 Types",
      badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
    },
    {
      id: "patterns",
      label: "Regex Explorer",
      icon: Code2,
      badge: null,
    },
    {
      id: "dfa",
      label: "DFA Visualizer & Lab",
      icon: Cpu,
      badge: "4 States",
      badgeColor: "bg-electric-500/15 text-electric-600 dark:text-electric-400 border border-electric-500/30",
    },
    {
      id: "performance",
      label: "RE vs DFA Lab",
      icon: BarChart3,
      badge: "1KB–1MB",
      badgeColor: "bg-violetAccent-500/15 text-violetAccent-600 dark:text-violetAccent-400 border border-violetAccent-500/30",
    },
    {
      id: "testing",
      label: "Test Cases & Validation",
      icon: CheckCircle2,
      badge: "18 Tests",
      badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
    },
    {
      id: "export",
      label: "Academic Report Export",
      icon: FileDown,
      badge: "PDF / CSV",
      badgeColor: "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    },
  ];

  return (
    <aside className="w-72 bg-panel border-r border-border-subtle flex flex-col justify-between h-screen sticky top-0 shrink-0 z-40 select-none shadow-subtle transition-colors duration-200">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            {/* Custom Automata Node Logo */}
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-electric-500 via-electric-600 to-violetAccent-600 p-0.5 shadow-glow flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-panel rounded-[10px] flex items-center justify-center relative overflow-hidden">
                <svg
                  viewBox="0 0 32 32"
                  className="w-6 h-6 text-electric-500 dark:text-electric-400 stroke-current fill-none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="8" cy="16" r="4" className="stroke-electric-500 dark:stroke-electric-400" />
                  <circle cx="24" cy="16" r="4" className="stroke-violetAccent-500 dark:stroke-violetAccent-400" />
                  <circle cx="24" cy="16" r="2" className="stroke-violetAccent-400 dark:stroke-violetAccent-300" />
                  <path d="M12 16h8" className="stroke-slate-400" />
                  <path d="M17 13l3 3-3 3" className="stroke-slate-400" />
                  <circle cx="16" cy="10" r="2" className="stroke-amber-500 fill-amber-500/20" />
                </svg>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-content-primary">
                  TextSentry
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-gradient-to-r from-electric-600 to-violetAccent-600 text-white shadow-sm">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-content-secondary leading-tight mt-0.5">
                Regex & DFA Text Correction Lab
              </p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-content-muted">
            Platform Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                  isActive
                    ? "bg-electric-500/10 dark:bg-electric-500/15 text-electric-600 dark:text-white border border-electric-500/30 shadow-sm"
                    : "text-content-secondary hover:text-content-primary hover:bg-panel-subtle border border-transparent"
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-electric-500 rounded-r-full" />
                )}

                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? "text-electric-500 dark:text-electric-400"
                        : "text-content-muted group-hover:text-content-secondary"
                    }`}
                  />
                  <span className={isActive ? "font-semibold" : ""}>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        item.badgeColor || "bg-panel-muted text-content-secondary"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-electric-500 dark:text-electric-400" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Theory of Computation Badge Footer */}
      <div className="p-4 m-3 rounded-2xl bg-panel-subtle border border-border-subtle text-xs">
        <div className="flex items-center gap-2 text-electric-600 dark:text-electric-400 font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Automata Theory Viva</span>
        </div>
        <p className="text-[11px] text-content-secondary leading-relaxed">
          Demonstrating mathematical equivalence between Regular Grammar and Finite Automata.
        </p>
        <div className="mt-2.5 pt-2 border-t border-border-subtle flex items-center justify-between text-[10px] text-content-muted font-mono">
          <span>Q = &#123;q0, q1, q2, qdead&#125;</span>
          <span className="text-electric-600 dark:text-electric-400 font-bold">F = &#123;q2&#125;</span>
        </div>
      </div>
    </aside>
  );
}
