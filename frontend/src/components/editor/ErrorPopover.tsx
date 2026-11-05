"use client";

import React from "react";
import { AlertCircle, Check, EyeOff, X, ArrowRight } from "lucide-react";
import { DetectedError } from "../../types";

interface ErrorPopoverProps {
  error: DetectedError;
  overlappingErrors?: DetectedError[];
  onSelectError?: (err: DetectedError) => void;
  onApply: (errorId: string) => void;
  onIgnore: (errorId: string) => void;
  onClose: () => void;
}

const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  lowercase_sentence_start: { bg: "bg-rose-500/15", border: "border-rose-500/40", text: "text-rose-600 dark:text-rose-400" },
  lowercase_pronoun_i: { bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-600 dark:text-amber-400" },
  multiple_spaces: { bg: "bg-electric-500/15", border: "border-electric-500/40", text: "text-electric-600 dark:text-electric-400" },
  repeated_words: { bg: "bg-violetAccent-500/15", border: "border-violetAccent-500/40", text: "text-violetAccent-600 dark:text-violetAccent-400" },
  missing_space_after_punct: { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-600 dark:text-emerald-400" },
  space_before_punct: { bg: "bg-pink-500/15", border: "border-pink-500/40", text: "text-pink-600 dark:text-pink-400" },
};

export function ErrorPopover({
  error,
  overlappingErrors = [],
  onSelectError,
  onApply,
  onIgnore,
  onClose,
}: ErrorPopoverProps) {
  const style = CATEGORY_STYLES[error.category] || {
    bg: "bg-panel-subtle",
    border: "border-border-muted",
    text: "text-content-primary",
  };

  return (
    <div className="z-50 w-96 rounded-2xl bg-panel backdrop-blur-2xl border border-border-muted shadow-card p-5 text-content-primary animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text}`}
            >
              {error.category.replace(/_/g, " ")}
            </span>
            <span className="text-[11px] font-mono text-content-muted">
              Line {error.line}:{error.column}
            </span>
          </div>
          <h4 className="text-sm font-bold text-content-primary tracking-tight">{error.pattern_name}</h4>
        </div>
        <button
          onClick={onClose}
          className="text-content-muted hover:text-content-primary p-1 rounded-lg hover:bg-panel-subtle transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Multiple overlapping notice */}
      {overlappingErrors.length > 0 && (
        <div className="mt-3 p-2.5 rounded-xl bg-panel-subtle border border-border-subtle text-xs">
          <div className="text-[11px] font-semibold text-amber-500 flex items-center gap-1.5 mb-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Overlapping Patterns ({overlappingErrors.length + 1} total):</span>
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] px-2 py-0.5 rounded bg-electric-500/20 text-electric-600 dark:text-electric-300 border border-electric-500/30">
              Current: {error.pattern_name}
            </span>
            {overlappingErrors.map((o) => (
              <button
                key={o.id}
                onClick={() => onSelectError && onSelectError(o)}
                className="text-[10px] px-2 py-0.5 rounded bg-panel hover:bg-panel-subtle text-content-secondary border border-border-subtle hover:border-border-muted transition-colors"
              >
                Switch to: {o.pattern_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Body details */}
      <div className="py-3 space-y-3 text-xs">
        {/* Matched vs Suggested */}
        <div className="p-3 rounded-xl bg-panel-subtle border border-border-subtle font-mono flex items-center justify-between gap-3">
          <div className="flex-1">
            <span className="text-[10px] text-content-muted block uppercase font-sans font-semibold">Matched Text</span>
            <span className="text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded inline-block mt-0.5 max-w-[120px] truncate">
              {error.is_zero_width ? "[Zero-Width Match]" : `"${error.matched_text}"`}
            </span>
          </div>

          <ArrowRight className="w-4 h-4 text-content-muted shrink-0" />

          <div className="flex-1 text-right">
            <span className="text-[10px] text-content-muted block uppercase font-sans font-semibold">Suggested Edit</span>
            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded inline-block mt-0.5 max-w-[120px] truncate">
              {error.suggested_correction === "" ? "[Remove Text]" : `"${error.suggested_correction}"`}
            </span>
          </div>
        </div>

        {/* Explanation */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-content-secondary">Theoretical Explanation:</span>
          <p className="text-content-secondary text-xs leading-relaxed">{error.explanation}</p>
        </div>

        {/* Technical offsets & Regex */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-panel-subtle p-2.5 rounded-xl border border-border-subtle">
          <div>
            <span className="text-content-muted">Offset:</span> [{error.start}..{error.end}]
          </div>
          <div>
            <span className="text-content-muted">Length:</span> {error.end - error.start} char(s)
          </div>
          <div className="col-span-2 truncate">
            <span className="text-content-muted">Regex:</span> <span className="text-electric-500 dark:text-electric-400">{error.regex}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
        <button
          onClick={() => onIgnore(error.id)}
          className="px-3.5 py-2 rounded-xl bg-panel-subtle hover:bg-panel-muted text-content-secondary text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Ignore</span>
        </button>

        <button
          onClick={() => onApply(error.id)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Apply Correction</span>
        </button>
      </div>
    </div>
  );
}
