"use client";

import React, { useState } from "react";
import { Code2, Copy, Check, AlertCircle, Sparkles, Terminal, Play, ArrowRight } from "lucide-react";
import { PatternDefinition } from "../../types";

interface PatternExplorerProps {
  patterns: PatternDefinition[];
}

export function PatternExplorer({ patterns }: PatternExplorerProps) {
  const [copiedRegex, setCopiedRegex] = useState<string | null>(null);
  const [selectedPatternIndex, setSelectedPatternIndex] = useState(0);

  // Live test scratchpad state
  const [scratchpadText, setScratchpadText] = useState("welcome to college.  i am a a student! hello,world ?");
  const [testResult, setTestResult] = useState<string | null>(null);

  const activePattern = patterns[selectedPatternIndex] || patterns[0];

  const handleCopy = (regex: string) => {
    navigator.clipboard.writeText(regex);
    setCopiedRegex(regex);
    setTimeout(() => setCopiedRegex(null), 2000);
  };

  const handleRunScratchpad = () => {
    if (!activePattern) return;
    try {
      // Client-side regex simulation for interactive playground
      const flags = activePattern.flags.includes("re.IGNORECASE") ? "gi" : "g";
      let cleanPattern = activePattern.regex;
      if (cleanPattern.startsWith("(?m)")) {
        cleanPattern = cleanPattern.replace("(?m)", "");
      }
      const re = new RegExp(cleanPattern, flags);
      const matches = [...scratchpadText.matchAll(re)];
      setTestResult(`Found ${matches.length} match(es) for pattern ${activePattern.name}.`);
    } catch (e: any) {
      setTestResult(`Evaluation note: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div>
            <h3 className="text-lg font-bold text-content-primary">Regular Expression Pattern Explorer</h3>
            <p className="text-xs text-content-secondary">
              Formal language specifications, lookaround assertions, capturing groups, and boundary constraints
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-electric-500/10 border border-electric-500/20 text-electric-600 dark:text-electric-400 font-semibold">
              6 Mandatory Grammatical Models
            </span>
          </div>
        </div>

        {/* Pattern Selection Tabs */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {patterns.map((p, idx) => {
            const isSelected = selectedPatternIndex === idx;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPatternIndex(idx);
                  setTestResult(null);
                }}
                className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-panel-subtle border-electric-500 shadow-glow font-medium"
                    : "bg-panel-muted/40 border-border-subtle hover:bg-panel-subtle text-content-secondary hover:text-content-primary"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: p.category_color }}
                  />
                  <span className="text-[10px] font-mono font-semibold text-content-muted">Pattern {idx + 1}</span>
                </div>
                <span className={`font-semibold line-clamp-1 ${isSelected ? "text-content-primary" : ""}`}>
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Pattern Details Card */}
        {activePattern && (
          <div className="mt-6 space-y-6">
            <div className="p-5 rounded-2xl bg-panel-subtle border border-border-subtle space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-electric-600 dark:text-electric-400">
                      PATTERN {selectedPatternIndex + 1}
                    </span>
                    <span className="text-content-muted">•</span>
                    <span className="text-xs font-mono text-content-secondary">
                      Flags: {activePattern.flags}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-content-primary mt-1">{activePattern.name}</h4>
                </div>

                <button
                  onClick={() => handleCopy(activePattern.regex)}
                  className="px-3 py-1.5 rounded-lg bg-panel hover:bg-panel-muted border border-border-subtle text-content-primary text-xs font-medium flex items-center gap-1.5 self-start sm:self-auto transition-colors shadow-subtle"
                >
                  {copiedRegex === activePattern.regex ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-content-secondary" />
                      <span>Copy Regex</span>
                    </>
                  )}
                </button>
              </div>

              {/* Exact Regular Expression Block */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted block mb-1">
                  Exact Regular Expression Formulation:
                </span>
                <div className="p-3.5 rounded-xl bg-panel border border-electric-500/30 font-mono text-sm text-electric-600 dark:text-electric-300 overflow-x-auto select-all shadow-inner">
                  {activePattern.regex}
                </div>
              </div>

              {/* Description & Theory */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">
                  Grammar & Matching Mechanics:
                </span>
                <p className="text-content-secondary text-xs leading-relaxed">
                  {activePattern.description}
                </p>
              </div>

              {/* Known Limitations */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Documented Theoretical & Practical Limitations:</span>
                </div>
                <p className="text-content-secondary leading-relaxed text-[11px]">
                  {activePattern.limitation}
                </p>
              </div>

              {/* Examples Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">
                    Incorrect Formulation:
                  </span>
                  <div className="font-mono text-rose-700 dark:text-rose-300 bg-panel p-2.5 rounded-lg border border-rose-500/20">
                    {activePattern.incorrect_example}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                    Corrected Formulation:
                  </span>
                  <div className="font-mono text-emerald-700 dark:text-emerald-300 bg-panel p-2.5 rounded-lg border border-emerald-500/20">
                    {activePattern.correct_example}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Live Playground Scratchpad */}
            <div className="p-5 rounded-2xl bg-panel-subtle border border-border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-electric-600 dark:text-electric-400" />
                  <h4 className="text-sm font-bold text-content-primary">Live Pattern Scratchpad</h4>
                </div>
                <button
                  onClick={handleRunScratchpad}
                  className="px-3.5 py-1.5 rounded-lg bg-electric-600 hover:bg-electric-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Test Pattern</span>
                </button>
              </div>

              <textarea
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                rows={2}
                placeholder="Enter custom sentence to evaluate against this pattern..."
                className="w-full p-3 rounded-xl bg-panel border border-border-subtle text-content-primary font-mono text-xs focus:outline-none focus:border-electric-500 transition-colors shadow-inner"
              />

              {testResult && (
                <div className="p-2.5 rounded-lg bg-panel border border-border-subtle text-xs text-electric-600 dark:text-electric-300 font-mono flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-electric-500 shrink-0" />
                  <span>{testResult}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
