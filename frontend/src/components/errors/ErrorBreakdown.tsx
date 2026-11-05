"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Sparkles, Code } from "lucide-react";
import { AnalysisResult } from "../../types";

interface ErrorBreakdownProps {
  analysis: AnalysisResult | null;
  onApplyCategoryOnly: (category: string) => Promise<void>;
  isLoading: boolean;
}

const CATEGORY_DETAILS: Record<
  string,
  {
    name: string;
    regex: string;
    description: string;
    color: string;
    badgeBg: string;
    badgeText: string;
    actionLabel: string;
  }
> = {
  lowercase_sentence_start: {
    name: "Sentence Starting with Lowercase Letter",
    regex: "(?m)(?:^|(?<=[.!?]))[ \\t]*([a-z])",
    description: "Sentence-initial characters must begin with an uppercase letter following line start or sentence terminators.",
    color: "#ef4444",
    badgeBg: "bg-rose-500/15 border-rose-500/30",
    badgeText: "text-rose-600 dark:text-rose-400",
    actionLabel: "Capitalize All Sentences",
  },
  lowercase_pronoun_i: {
    name: "Lowercase Pronoun 'i'",
    regex: "(?<![A-Za-z])i(?![A-Za-z])",
    description: "Standalone lowercase pronoun 'i' must always be capitalized to 'I' using ASCII lookaround word isolation.",
    color: "#f59e0b",
    badgeBg: "bg-amber-500/15 border-amber-500/30",
    badgeText: "text-amber-600 dark:text-amber-400",
    actionLabel: "Capitalize Pronoun 'I'",
  },
  multiple_spaces: {
    name: "Multiple Consecutive Spaces (DFA Benchmark)",
    regex: " {2,}",
    description: "Maximal runs of two or more ASCII spaces collapsed to exactly one space. Serves as primary DFA comparison model.",
    color: "#3b82f6",
    badgeBg: "bg-electric-500/15 border-electric-500/30",
    badgeText: "text-electric-600 dark:text-electric-400",
    actionLabel: "Collapse Consecutive Spaces",
  },
  repeated_words: {
    name: "Repeated Consecutive Words",
    regex: "\\b([A-Za-z]+)[ \\t]+\\1\\b",
    description: "Identical consecutive words separated by horizontal whitespace resolved via case-insensitive backreferencing.",
    color: "#8b5cf6",
    badgeBg: "bg-violetAccent-500/15 border-violetAccent-500/30",
    badgeText: "text-violetAccent-600 dark:text-violetAccent-400",
    actionLabel: "Deduplicate Adjacent Words",
  },
  missing_space_after_punct: {
    name: "Missing Space After Punctuation",
    regex: "(?<=[,.;:!?])(?=[A-Za-z])",
    description: "Zero-width assertion between clause/sentence punctuation marks and adjacent letters without standard spacing.",
    color: "#10b981",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    actionLabel: "Insert Missing Spaces",
  },
  space_before_punct: {
    name: "Unnecessary Space Before Punctuation",
    regex: " +(?=[,.;:!?])",
    description: "Unnecessary whitespace preceding commas, periods, colons, or question marks removed for typographical correctness.",
    color: "#ec4899",
    badgeBg: "bg-pink-500/15 border-pink-500/30",
    badgeText: "text-pink-600 dark:text-pink-400",
    actionLabel: "Trim Pre-Punctuation Spaces",
  },
};

export function ErrorBreakdown({
  analysis,
  onApplyCategoryOnly,
  isLoading,
}: ErrorBreakdownProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (cat: string) => {
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div>
            <h3 className="text-lg font-bold text-content-primary">Error Category Taxonomy</h3>
            <p className="text-xs text-content-secondary mt-0.5">
              Systematic classification and live detection telemetry across the 6 formal error models
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3.5 py-1.5 rounded-xl bg-panel-subtle border border-border-subtle text-content-secondary">
              Total Matches: <strong className="text-electric-600 dark:text-electric-400 font-bold">{analysis?.total_errors ?? 0}</strong>
            </span>
          </div>
        </div>

        {/* 6 Category Cards */}
        <div className="mt-6 space-y-4">
          {Object.entries(CATEGORY_DETAILS).map(([catKey, details]) => {
            const count = analysis?.category_counts[catKey] ?? 0;
            const errors = analysis?.errors.filter((e) => e.category === catKey) || [];
            const isExpanded = expandedCategory === catKey;

            return (
              <div
                key={catKey}
                className="rounded-2xl border border-border-subtle bg-panel-subtle/50 overflow-hidden transition-all hover:border-border-muted shadow-subtle"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleCategory(catKey)}
                  className="p-4.5 flex items-center justify-between cursor-pointer select-none hover:bg-panel transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: details.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-content-primary">{details.name}</h4>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${details.badgeBg} ${details.badgeText}`}
                        >
                          {count} {count === 1 ? "occurrence" : "occurrences"}
                        </span>
                      </div>
                      <p className="text-xs text-content-secondary mt-0.5">{details.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {count > 0 && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onApplyCategoryOnly(catKey);
                        }}
                        disabled={isLoading}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-panel hover:bg-panel-subtle text-electric-600 dark:text-electric-400 border border-border-subtle hover:border-electric-500/40 text-xs font-semibold transition-all shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{details.actionLabel}</span>
                      </button>
                    )}

                    <div className="p-1 rounded-lg text-content-muted hover:text-content-primary">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-border-subtle bg-canvas/60 space-y-4 text-xs">
                    <div className="flex items-center gap-2 font-mono text-[11px] bg-panel p-3 rounded-xl border border-border-subtle">
                      <Code className="w-3.5 h-3.5 text-electric-500 shrink-0" />
                      <span className="text-content-muted">Regular Expression:</span>
                      <span className="text-electric-600 dark:text-electric-300 font-bold">{details.regex}</span>
                    </div>

                    {errors.length > 0 ? (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-content-primary uppercase tracking-wider block">
                          Detected Instances ({errors.length}):
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto">
                          {errors.map((err) => (
                            <div
                              key={err.id}
                              className="p-3 rounded-xl bg-panel border border-border-subtle font-mono text-xs flex flex-col justify-between shadow-subtle"
                            >
                              <div className="flex items-center justify-between text-[11px] text-content-muted mb-1.5">
                                <span>Line {err.line}, Col {err.column}</span>
                                <span>Offset [{err.start}..{err.end}]</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded truncate max-w-[130px] font-semibold">
                                  {err.is_zero_width ? "[Zero-Width]" : `"${err.matched_text}"`}
                                </span>
                                <span className="text-content-muted">→</span>
                                <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded truncate max-w-[130px] font-semibold">
                                  {err.suggested_correction === "" ? "[Remove]" : `"${err.suggested_correction}"`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-content-muted">
                        No instances of this error pattern detected in the active document.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
