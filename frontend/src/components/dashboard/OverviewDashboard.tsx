"use client";

import React from "react";
import {
  FileText,
  AlertTriangle,
  Layers,
  CheckCircle,
  Zap,
  Timer,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import { AnalysisResult } from "../../types";

interface OverviewDashboardProps {
  analysis: AnalysisResult | null;
  correctionsCount: number;
  onLoadSample: () => void;
  onAnalyze: () => void;
  onNavigateToEditor: () => void;
  onNavigateToDFA: () => void;
  isLoading: boolean;
}

const CATEGORY_NAMES: Record<string, { label: string; color: string }> = {
  lowercase_sentence_start: { label: "Sentence Lowercase", color: "#ef4444" },
  lowercase_pronoun_i: { label: "Pronoun 'i'", color: "#f59e0b" },
  multiple_spaces: { label: "Multiple Spaces", color: "#3b82f6" },
  repeated_words: { label: "Repeated Words", color: "#8b5cf6" },
  missing_space_after_punct: { label: "Missing Space", color: "#10b981" },
  space_before_punct: { label: "Space Before Punct", color: "#ec4899" },
};

export function OverviewDashboard({
  analysis,
  correctionsCount,
  onLoadSample,
  onAnalyze,
  onNavigateToEditor,
  onNavigateToDFA,
  isLoading,
}: OverviewDashboardProps) {
  // Compute chart data dynamically from real analysis counts
  const chartData = analysis
    ? Object.entries(analysis.category_counts).map(([key, value]) => ({
        name: CATEGORY_NAMES[key]?.label || key,
        count: value,
        color: CATEGORY_NAMES[key]?.color || "#3b82f6",
      }))
    : [];

  const distinctCategories = analysis
    ? Object.values(analysis.category_counts).filter((c) => c > 0).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Welcome / Hero Banner */}
      <div className="relative rounded-3xl p-7 overflow-hidden bg-gradient-to-r from-electric-600/10 via-panel to-violetAccent-600/10 border border-border-subtle shadow-card">
        <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-electric-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-48 -top-12 w-56 h-56 bg-violetAccent-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-500/15 border border-electric-500/30 text-electric-600 dark:text-electric-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Theory of Computation Research Lab</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-content-primary tracking-tight">
              Regex & Deterministic Finite Automata Analysis
            </h2>
            <p className="text-content-secondary text-sm leading-relaxed">
              Syntactic and lexical text error identification combining Python&apos;s Regular Expressions
              with custom pure-DFA state transitions. Measure empirical speeds, inspect lookarounds,
              and resolve multi-pattern conflicts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onLoadSample}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-panel hover:bg-panel-subtle border border-border-subtle hover:border-border-muted text-content-primary text-xs font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-electric-500" />
              <span>Load 23-Error Benchmark</span>
            </button>
            <button
              onClick={onAnalyze}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-electric-600 to-violetAccent-600 hover:from-electric-500 hover:to-violetAccent-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-glow hover:shadow-glow-violet disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Complete Analysis</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8 Live Core Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Total Characters */}
        <div className="glass-panel rounded-2xl p-4 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-content-secondary text-xs font-medium">
            <span>Analyzed Characters</span>
            <FileText className="w-4 h-4 text-electric-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-content-primary">
              {analysis ? analysis.char_count.toLocaleString() : "0"}
            </span>
            <span className="text-[11px] text-content-muted">chars</span>
          </div>
          <div className="mt-1 text-[11px] text-content-muted font-mono">
            {analysis ? `${analysis.line_count} line(s)` : "No input"}
          </div>
        </div>

        {/* Metric 2: Total Words */}
        <div className="glass-panel rounded-2xl p-4 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-content-secondary text-xs font-medium">
            <span>Word Count</span>
            <Layers className="w-4 h-4 text-violetAccent-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-content-primary">
              {analysis ? analysis.word_count.toLocaleString() : "0"}
            </span>
            <span className="text-[11px] text-content-muted">words</span>
          </div>
          <div className="mt-1 text-[11px] text-content-muted font-mono">
            Lexical tokens
          </div>
        </div>

        {/* Metric 3: Total Errors Detected */}
        <div className="glass-panel rounded-2xl p-4 transition-all hover:-translate-y-0.5 border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center justify-between text-rose-500 dark:text-rose-400 text-xs font-medium">
            <span>Errors Detected</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {analysis ? analysis.total_errors : "0"}
            </span>
            <span className="text-[11px] text-rose-500/80">matches</span>
          </div>
          <div className="mt-1 text-[11px] text-content-muted">
            Across 6 regex patterns
          </div>
        </div>

        {/* Metric 4: Distinct Categories */}
        <div className="glass-panel rounded-2xl p-4 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-content-secondary text-xs font-medium">
            <span>Active Categories</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {distinctCategories}
            </span>
            <span className="text-[11px] text-content-muted">/ 6 categories</span>
          </div>
          <div className="mt-1 text-[11px] text-content-muted">
            Formal error classifications
          </div>
        </div>

        {/* Metric 5: Total Corrections */}
        <div className="glass-panel rounded-2xl p-4 transition-all hover:-translate-y-0.5 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <span>Corrections Performed</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {correctionsCount}
            </span>
            <span className="text-[11px] text-emerald-500/80">resolved</span>
          </div>
          <div className="mt-1 text-[11px] text-content-muted">
            Conflict-free edits applied
          </div>
        </div>

        {/* Metric 6: Error Density */}
        <div className="glass-panel rounded-2xl p-4 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-content-secondary text-xs font-medium">
            <span>Error Density</span>
            <TrendingDown className="w-4 h-4 text-electric-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-content-primary">
              {analysis ? analysis.error_density_per_100_words.toFixed(1) : "0.0"}
            </span>
            <span className="text-[11px] text-content-muted">per 100 words</span>
          </div>
          <div className="mt-1 text-[11px] text-content-muted">
            Normalized density index
          </div>
        </div>

        {/* Metric 7: Regex Execution Time */}
        <div className="glass-panel rounded-2xl p-4 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-content-secondary text-xs font-medium">
            <span>Regex Time</span>
            <Zap className="w-4 h-4 text-electric-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-electric-600 dark:text-electric-400">
              {analysis ? analysis.regex_time_ms.toFixed(3) : "0.000"}
            </span>
            <span className="text-[11px] text-content-muted">ms</span>
          </div>
          <div className="mt-1 text-[11px] text-content-muted font-mono">
            6 patterns combined
          </div>
        </div>

        {/* Metric 8: DFA Execution Time */}
        <div className="glass-panel rounded-2xl p-4 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-content-secondary text-xs font-medium">
            <span>DFA Time</span>
            <Timer className="w-4 h-4 text-violetAccent-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-violetAccent-600 dark:text-violetAccent-400">
              {analysis ? analysis.dfa_time_ms.toFixed(3) : "0.000"}
            </span>
            <span className="text-[11px] text-content-muted">ms</span>
          </div>
          <div className="mt-1 text-[11px] text-content-muted font-mono">
            Pure state transitions
          </div>
        </div>
      </div>

      {/* Main Content Grid: Distribution Chart & Detection Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Error Category Distribution Chart (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-content-primary">Error Category Distribution</h3>
              <p className="text-xs text-content-secondary">Live breakdown across the six formal error models</p>
            </div>
            <button
              onClick={onNavigateToEditor}
              className="text-xs font-semibold text-electric-600 dark:text-electric-400 hover:text-electric-500 flex items-center gap-1 transition-colors"
            >
              <span>Inspect in Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {analysis && chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-muted)"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-panel)",
                      borderColor: "var(--border-muted)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "var(--text-primary)",
                      boxShadow: "var(--shadow-card)",
                    }}
                    cursor={{ fill: "rgba(59, 130, 246, 0.08)" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-content-muted space-y-3 border border-dashed border-border-muted rounded-2xl">
              <AlertTriangle className="w-8 h-8 text-content-muted" />
              <p className="text-xs">No analysis data available. Load the sample or input text to view distribution.</p>
              <button
                onClick={onLoadSample}
                className="px-3 py-1.5 rounded-lg bg-panel-subtle text-xs font-medium text-electric-600 dark:text-electric-400 hover:bg-panel-muted"
              >
                Load Sample Document
              </button>
            </div>
          )}
        </div>

        {/* Current Document Snapshot & Quick Actions (1 col) */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-content-primary mb-1">Active Document Session</h3>
            <p className="text-xs text-content-secondary mb-4">Current text snapshot under evaluation</p>

            <div className="p-4 rounded-xl bg-panel-subtle border border-border-subtle font-mono text-xs text-content-primary max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
              {analysis?.text || "No text loaded in active session. Click 'Load 23-Error Benchmark' to start."}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-border-subtle">
                <span className="text-content-secondary">Multiple Spaces (DFA pattern)</span>
                <span className="font-mono font-semibold text-electric-600 dark:text-electric-400">
                  {analysis?.category_counts["multiple_spaces"] ?? 0} matches
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-border-subtle">
                <span className="text-content-secondary">Sentence Capitalization</span>
                <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                  {analysis?.category_counts["lowercase_sentence_start"] ?? 0} matches
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-border-subtle">
                <span className="text-content-secondary">Pronoun &apos;i&apos; Normalization</span>
                <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                  {analysis?.category_counts["lowercase_pronoun_i"] ?? 0} matches
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border-subtle flex items-center gap-3">
            <button
              onClick={onNavigateToEditor}
              className="flex-1 py-2 px-3 rounded-xl bg-electric-500/10 hover:bg-electric-500/20 border border-electric-500/30 text-electric-600 dark:text-electric-400 text-xs font-semibold text-center transition-colors"
            >
              Open Editor
            </button>
            <button
              onClick={onNavigateToDFA}
              className="flex-1 py-2 px-3 rounded-xl bg-violetAccent-500/10 hover:bg-violetAccent-500/20 border border-violetAccent-500/30 text-violetAccent-600 dark:text-violetAccent-400 text-xs font-semibold text-center transition-colors"
            >
              Explore DFA Lab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
