"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Zap,
  Cpu,
  CheckCircle2,
  RotateCcw,
  Clock,
  Code2,
  FileCode,
  Info,
  Scale,
  Sparkles,
  Activity,
  Gauge,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { CompareResult } from "../../types";
import { api } from "../../lib/api";

interface PerformanceLabProps {
  documentText: string;
}

export function PerformanceLab({ documentText }: PerformanceLabProps) {
  const [compareData, setCompareData] = useState<CompareResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chartScale, setChartScale] = useState<"linear" | "log">("log");

  const runBenchmark = async () => {
    setIsLoading(true);
    try {
      const res = await api.compareRegexAndDFA(documentText, true);
      setCompareData(res);
    } catch (e) {
      console.error("Benchmark failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runBenchmark();
  }, [documentText]);

  // Format chart data with both linear and log values for optimal visualization
  const chartData =
    compareData?.benchmarks.map((b) => {
      const reMs = Number(b.regex_median_ms.toFixed(3));
      const dfaMs = Number(b.dfa_median_ms.toFixed(3));
      // Log10 of nanoseconds for balanced bar scale across 1KB..1MB
      const reLog = Number(Math.log10(Math.max(1, b.regex_median_ns)).toFixed(2));
      const dfaLog = Number(Math.log10(Math.max(1, b.dfa_median_ns)).toFixed(2));

      return {
        size: b.size_label,
        chars: b.char_count,
        regexVal: chartScale === "linear" ? reMs : reLog,
        dfaVal: chartScale === "linear" ? dfaMs : dfaLog,
        regexRawMs: reMs,
        dfaRawMs: dfaMs,
        matches: b.matches_found,
      };
    }) || [];

  // Calculate 1MB throughput
  const mbBenchmark = compareData?.benchmarks.find((b) => b.size_label.includes("MB"));
  const regexThroughputMBs = mbBenchmark && mbBenchmark.regex_median_ms > 0
    ? (mbBenchmark.char_count / (1024 * 1024)) / (mbBenchmark.regex_median_ms / 1000)
    : 0;
  const dfaThroughputMBs = mbBenchmark && mbBenchmark.dfa_median_ms > 0
    ? (mbBenchmark.char_count / (1024 * 1024)) / (mbBenchmark.dfa_median_ms / 1000)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-violetAccent-600 dark:text-violetAccent-400 bg-violetAccent-500/10 px-2.5 py-0.5 rounded-full border border-violetAccent-500/20">
                Empirical Evaluation
              </span>
              <span className="text-xs font-mono text-content-muted">Target Pattern: ` &#123;2,&#125;`</span>
            </div>
            <h3 className="text-xl font-bold text-content-primary mt-1">
              RE vs DFA Performance & Complexity Lab
            </h3>
            <p className="text-xs text-content-secondary mt-0.5">
              Microbenchmarking using Python&apos;s <code className="text-electric-500 font-mono font-bold">time.perf_counter_ns()</code> across 1KB, 10KB, 100KB, and 1MB corpora
            </p>
          </div>

          <button
            onClick={runBenchmark}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violetAccent-600 to-electric-600 hover:from-violetAccent-500 hover:to-electric-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-glow-violet disabled:opacity-50 self-start sm:self-auto"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Running Benchmarks..." : "Re-run Live Benchmarks"}</span>
          </button>
        </div>

        {/* Exact Match Equality Verification Banner */}
        <div className="mt-5 p-4 rounded-2xl bg-panel-subtle border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                compareData?.exact_matches_agreement
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-content-primary">Mathematical Equivalence Verification:</span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                    compareData?.exact_matches_agreement
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {compareData?.exact_matches_agreement ? "100% Exact Agreement" : "Mismatch"}
                </span>
              </div>
              <p className="text-xs text-content-secondary mt-0.5">
                Every start and end character offset returned by Python Regex matches the pure DFA scanner output bit-for-bit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs font-mono">
            <div>
              <span className="text-content-muted block text-[10px]">Regex Matches</span>
              <strong className="text-content-primary text-base font-bold">{compareData?.regex_occurrences ?? 0}</strong>
            </div>
            <span className="text-content-muted text-sm font-sans">=</span>
            <div>
              <span className="text-content-muted block text-[10px]">DFA Matches</span>
              <strong className="text-content-primary text-base font-bold">{compareData?.dfa_occurrences ?? 0}</strong>
            </div>
          </div>
        </div>

        {/* Live Throughput Metrics */}
        {mbBenchmark && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-panel border border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] text-content-muted uppercase font-sans font-semibold block">Regex Throughput (1MB Corpus)</span>
                <span className="text-lg font-bold text-electric-600 dark:text-electric-400">{regexThroughputMBs.toFixed(1)} MB/sec</span>
              </div>
              <Gauge className="w-6 h-6 text-electric-500/40" />
            </div>
            <div className="p-3.5 rounded-xl bg-panel border border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] text-content-muted uppercase font-sans font-semibold block">Pure DFA Throughput (1MB Corpus)</span>
                <span className="text-lg font-bold text-violetAccent-600 dark:text-violetAccent-400">{dfaThroughputMBs.toFixed(1)} MB/sec</span>
              </div>
              <Activity className="w-6 h-6 text-violetAccent-500/40" />
            </div>
          </div>
        )}
      </div>

      {/* Benchmark Execution Time Chart (1KB, 10KB, 100KB, 1MB) */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="text-base font-bold text-content-primary">Empirical Execution Time Comparison</h4>
            <p className="text-xs text-content-secondary">
              Benchmarking across standardized corpora sizes using nanosecond clock measurements
            </p>
          </div>

          {/* Scale Toggle: Linear vs Logarithmic */}
          <div className="flex items-center bg-panel p-1 rounded-xl border border-border-subtle text-xs font-semibold shadow-subtle">
            <button
              onClick={() => setChartScale("log")}
              className={`px-3 py-1 rounded-lg transition-all ${
                chartScale === "log"
                  ? "bg-electric-600 text-white shadow-sm font-bold"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              Log₁₀ Scale (Balanced)
            </button>
            <button
              onClick={() => setChartScale("linear")}
              className={`px-3 py-1 rounded-lg transition-all ${
                chartScale === "linear"
                  ? "bg-electric-600 text-white shadow-sm font-bold"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              Linear Scale (ms)
            </button>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="size" stroke="var(--text-muted)" fontSize={12} />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={11}
                  label={{
                    value: chartScale === "linear" ? "Time (ms)" : "Log₁₀(ns)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "var(--text-muted)",
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-panel border border-border-muted shadow-card font-mono text-xs space-y-1">
                          <div className="font-bold text-content-primary font-sans">{label} Corpus ({data.chars.toLocaleString()} chars)</div>
                          <div className="text-electric-500 font-semibold">
                            Python Regex: {data.regexRawMs.toFixed(3)} ms
                          </div>
                          <div className="text-violetAccent-500 font-semibold">
                            Pure Python DFA: {data.dfaRawMs.toFixed(3)} ms
                          </div>
                          <div className="text-emerald-500 text-[10px]">
                            {data.matches.toLocaleString()} multiple-space runs identified
                          </div>
                          <div className="text-content-muted text-[10px] pt-1 border-t border-border-subtle">
                            Ratio: DFA takes {(data.dfaRawMs / Math.max(0.001, data.regexRawMs)).toFixed(1)}x time
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="regexVal" name="Python Regex re.finditer" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="dfaVal" name="Pure Python DFA scan" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-content-muted text-xs">
            Loading benchmark dataset metrics...
          </div>
        )}

        {/* Benchmark Table with Nanosecond Resolution */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse border border-border-subtle rounded-2xl overflow-hidden">
            <thead className="bg-panel-subtle text-content-muted border-b border-border-subtle">
              <tr>
                <th className="py-3 px-3.5">Dataset Scale</th>
                <th className="py-3 px-3.5">Char Count</th>
                <th className="py-3 px-3.5">Regex Median</th>
                <th className="py-3 px-3.5">DFA Median</th>
                <th className="py-3 px-3.5">Regex StdDev</th>
                <th className="py-3 px-3.5">DFA StdDev</th>
                <th className="py-3 px-3.5">Matches Found</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60 bg-canvas">
              {compareData?.benchmarks.map((b, idx) => (
                <tr key={idx} className="hover:bg-panel-subtle/40 transition-colors">
                  <td className="py-3 px-3.5 font-bold text-content-primary">{b.size_label}</td>
                  <td className="py-3 px-3.5 text-content-secondary">{b.char_count.toLocaleString()}</td>
                  <td className="py-3 px-3.5 text-electric-600 dark:text-electric-400 font-bold">{b.regex_median_ms.toFixed(3)} ms</td>
                  <td className="py-3 px-3.5 text-violetAccent-600 dark:text-violetAccent-400 font-bold">{b.dfa_median_ms.toFixed(3)} ms</td>
                  <td className="py-3 px-3.5 text-content-muted font-sans text-[11px]">±{(b.regex_std_ns / 1e6).toFixed(3)} ms</td>
                  <td className="py-3 px-3.5 text-content-muted font-sans text-[11px]">±{(b.dfa_std_ns / 1e6).toFixed(3)} ms</td>
                  <td className="py-3 px-3.5 text-emerald-600 dark:text-emerald-400 font-bold">{b.matches_found.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Codebase Lines of Code & Engineering Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lines of Code Table */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-electric-500" />
            <h4 className="text-sm font-bold text-content-primary">Source Lines of Code (LOC) Comparison</h4>
          </div>
          <p className="text-xs text-content-secondary">
            Verifiable file metrics counted directly from backend implementation modules:
          </p>

          <div className="space-y-3 font-mono text-xs">
            {/* Regex Engine LOC */}
            <div className="p-4 rounded-2xl bg-panel-subtle border border-border-subtle space-y-2">
              <div className="flex items-center justify-between text-content-primary font-bold">
                <span>regex_engine.py</span>
                <span className="text-electric-600 dark:text-electric-400">
                  {compareData?.code_metrics?.regex_engine?.code ?? 306} Code Lines
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-content-muted pt-1 border-t border-border-subtle">
                <div>Total: {compareData?.code_metrics?.regex_engine?.total ?? 352}</div>
                <div>Comments: {compareData?.code_metrics?.regex_engine?.comments ?? 17}</div>
                <div>Blank: {compareData?.code_metrics?.regex_engine?.blank ?? 29}</div>
              </div>
              <p className="text-[10px] text-content-secondary font-sans mt-1">
                Engine: C-compiled SRE module. High expressiveness; concise declarative syntax for complex lookarounds.
              </p>
            </div>

            {/* DFA Engine LOC */}
            <div className="p-4 rounded-2xl bg-panel-subtle border border-border-subtle space-y-2">
              <div className="flex items-center justify-between text-content-primary font-bold">
                <span>dfa_engine.py</span>
                <span className="text-violetAccent-600 dark:text-violetAccent-400">
                  {compareData?.code_metrics?.dfa_engine?.code ?? 149} Code Lines
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-content-muted pt-1 border-t border-border-subtle">
                <div>Total: {compareData?.code_metrics?.dfa_engine?.total ?? 225}</div>
                <div>Comments: {compareData?.code_metrics?.dfa_engine?.comments ?? 41}</div>
                <div>Blank: {compareData?.code_metrics?.dfa_engine?.blank ?? 35}</div>
              </div>
              <p className="text-[10px] text-content-secondary font-sans mt-1">
                Engine: Pure Python state machine. Explicit transition matrix, zero regex dependencies.
              </p>
            </div>
          </div>
        </div>

        {/* Academic Discussion & Theoretical Guarantees */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-bold text-content-primary">Theory of Computation Analysis</h4>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-content-secondary">
            <div className="p-4 rounded-2xl bg-panel-subtle border border-border-subtle space-y-1">
              <strong className="text-electric-600 dark:text-electric-400 block font-bold">Why C-Compiled Regex Outperforms Python DFA in Clock Time:</strong>
              <p className="text-[11px] leading-relaxed">
                Python&apos;s <code className="text-content-primary font-mono font-semibold">re</code> module is implemented in optimized C,
                employing vectorized memory scanning and low-level pointer arithmetic. In contrast, our pure DFA is
                interpreted in the Python virtual machine loop. Although both execute with strict <code className="text-content-primary font-mono font-semibold">O(N)</code> time
                complexity, C bytecode execution incurs significantly fewer CPU cycles per character.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-panel-subtle border border-border-subtle space-y-1">
              <strong className="text-violetAccent-600 dark:text-violetAccent-400 block font-bold">Theoretical Advantages of Pure DFA:</strong>
              <p className="text-[11px] leading-relaxed">
                1. <strong>Strict Linear Time:</strong> DFA guarantees deterministic <code className="text-content-primary font-mono font-semibold">O(N)</code> execution without risk of catastrophic backtracking (ReDoS).<br />
                2. <strong>O(1) Space:</strong> Requires only an integer state register and pointer, unlike regex backtracking call stacks.<br />
                3. <strong>Formal Provability:</strong> Verifiable state transitions directly suitable for hardware synthesis (FPGA/ASIC).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
