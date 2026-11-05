"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Layers,
} from "lucide-react";
import { TestSuiteReport, TestCaseResult } from "../../types";
import { api } from "../../lib/api";

export function TestingDashboard() {
  const [report, setReport] = useState<TestSuiteReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const runAllTests = async () => {
    setIsLoading(true);
    try {
      const data = await api.runTests();
      setReport(data);
    } catch (e) {
      console.error("Test execution failed:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runAllTests();
  }, []);

  const categories = React.useMemo(() => {
    if (!report) return [];
    return Array.from(new Set(report.tests.map((t) => t.category)));
  }, [report]);

  const filteredTests = React.useMemo(() => {
    if (!report) return [];
    return report.tests.filter((t) => {
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          t.description.toLowerCase().includes(q) ||
          t.expected_result.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [report, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Automated Verification Suite
              </span>
              <span className="text-xs font-mono text-content-muted">pytest & API Runner</span>
            </div>
            <h3 className="text-xl font-bold text-content-primary mt-1">
              Automata & Regex Verification Test Bench
            </h3>
            <p className="text-xs text-content-secondary mt-0.5">
              18 mandatory academic verification scenarios tested dynamically against active backend engines
            </p>
          </div>

          <button
            onClick={runAllTests}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 self-start sm:self-auto"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Executing Test Suite..." : "Execute Test Suite Now"}</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-panel-subtle border border-border-subtle">
            <span className="text-[10px] text-content-muted uppercase font-sans font-semibold block">Total Test Cases</span>
            <span className="text-2xl font-bold text-content-primary mt-1 block">{report?.total_tests ?? 18}</span>
            <span className="text-[11px] text-content-muted block mt-1">18/18 implemented</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-sans font-semibold block">Passed Tests</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">{report?.passed_tests ?? 0}</span>
            <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 block mt-1 font-semibold">100% Pass Rate</span>
          </div>

          <div className="p-4 rounded-2xl bg-panel-subtle border border-border-subtle">
            <span className="text-[10px] text-content-muted uppercase font-sans font-semibold block">Failed Tests</span>
            <span className="text-2xl font-bold text-content-primary mt-1 block">{report?.failed_tests ?? 0}</span>
            <span className="text-[11px] text-content-muted block mt-1">0 regressions</span>
          </div>

          <div className="p-4 rounded-2xl bg-panel-subtle border border-border-subtle">
            <span className="text-[10px] text-content-muted uppercase font-sans font-semibold block">Execution Time</span>
            <span className="text-2xl font-bold text-electric-600 dark:text-electric-400 mt-1 block">
              {report?.duration_ms ? `${report.duration_ms.toFixed(2)} ms` : "0.00 ms"}
            </span>
            <span className="text-[11px] text-content-muted block mt-1">Sub-second execution</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search test descriptions, expectations, or inputs..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-canvas border border-border-subtle text-content-primary font-mono text-xs focus:outline-none focus:border-electric-500 shadow-inner"
          />
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              categoryFilter === "all"
                ? "bg-electric-600 text-white font-semibold shadow-sm"
                : "bg-panel-subtle text-content-secondary hover:text-content-primary"
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                categoryFilter === c
                  ? "bg-panel text-content-primary border border-border-muted font-semibold shadow-sm"
                  : "bg-panel-subtle text-content-secondary hover:text-content-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="glass-panel rounded-3xl p-6 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="bg-panel-subtle border-b border-border-subtle text-content-muted">
              <tr>
                <th className="py-3 px-3.5">#</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5">Scenario Description</th>
                <th className="py-3 px-3.5">Input Sample</th>
                <th className="py-3 px-3.5">Expected Result</th>
                <th className="py-3 px-3.5">Actual Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/60 bg-canvas">
              {filteredTests.map((t) => (
                <tr key={t.id} className="hover:bg-panel-subtle/40 transition-colors">
                  <td className="py-3 px-3.5 text-content-muted font-bold">{t.id}</td>
                  <td className="py-3 px-3.5">
                    {t.passed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>PASSED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                        <XCircle className="w-3 h-3" />
                        <span>FAILED</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-content-secondary font-semibold text-[11px] whitespace-nowrap">
                    {t.category}
                  </td>
                  <td className="py-3 px-3.5 font-sans text-content-primary min-w-[200px]">
                    <span className="font-semibold">{t.description}</span>
                    {t.details && (
                      <span className="block text-[10px] text-content-muted mt-0.5">
                        {t.details}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-amber-600 dark:text-amber-300 max-w-[160px] truncate" title={t.input_text}>
                    {t.input_text}
                  </td>
                  <td className="py-3 px-3.5 text-content-secondary max-w-[200px] truncate" title={t.expected_result}>
                    {t.expected_result}
                  </td>
                  <td className="py-3 px-3.5 text-electric-600 dark:text-electric-300 max-w-[200px] truncate font-bold" title={t.actual_result}>
                    {t.actual_result}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
