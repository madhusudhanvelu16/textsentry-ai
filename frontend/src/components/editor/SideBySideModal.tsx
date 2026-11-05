"use client";

import React, { useState, useMemo } from "react";
import { X, Copy, Check, Download, SplitSquareVertical, Columns2, AlignLeft, Sparkles } from "lucide-react";

interface SideBySideModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  correctedText: string;
  onDownloadCorrected: () => void;
}

export function SideBySideModal({
  isOpen,
  onClose,
  originalText,
  correctedText,
  onDownloadCorrected,
}: SideBySideModalProps) {
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedCorrected, setCopiedCorrected] = useState(false);

  // Compute line-by-line diff
  const diffLines = useMemo(() => {
    const origLines = originalText.split("\n");
    const corrLines = correctedText.split("\n");
    const maxLen = Math.max(origLines.length, corrLines.length);

    const rows = [];
    for (let i = 0; i < maxLen; i++) {
      const orig = origLines[i] ?? "";
      const corr = corrLines[i] ?? "";
      const isDiff = orig !== corr;
      rows.push({
        lineNum: i + 1,
        orig,
        corr,
        isDiff,
      });
    }
    return rows;
  }, [originalText, correctedText]);

  if (!isOpen) return null;

  const handleCopyOriginal = () => {
    navigator.clipboard.writeText(originalText);
    setCopiedOriginal(true);
    setTimeout(() => setCopiedOriginal(false), 2000);
  };

  const handleCopyCorrected = () => {
    navigator.clipboard.writeText(correctedText);
    setCopiedCorrected(true);
    setTimeout(() => setCopiedCorrected(false), 2000);
  };

  const diffCount = diffLines.filter((l) => l.isDiff).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-6xl rounded-3xl bg-panel border border-border-muted shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-content-primary">
        {/* Header Bar */}
        <div className="p-5 border-b border-border-subtle flex flex-wrap items-center justify-between gap-4 bg-panel-subtle/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-electric-500/10 text-electric-600 dark:text-electric-400 border border-electric-500/20 shadow-sm">
              <SplitSquareVertical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-content-primary">Document Diff Inspector</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {diffCount} line(s) modified
                </span>
              </div>
              <p className="text-xs text-content-secondary mt-0.5">
                Visualizing character and line replacements between raw input and normalized snapshot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-panel p-1 rounded-xl border border-border-subtle text-xs font-semibold">
              <button
                onClick={() => setViewMode("split")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === "split"
                    ? "bg-electric-600 text-white shadow-sm"
                    : "text-content-secondary hover:text-content-primary"
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
              <button
                onClick={() => setViewMode("unified")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === "unified"
                    ? "bg-electric-600 text-white shadow-sm"
                    : "text-content-secondary hover:text-content-primary"
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Unified View</span>
              </button>
            </div>

            <button
              onClick={onDownloadCorrected}
              className="px-3 py-2 rounded-xl bg-panel hover:bg-panel-subtle text-content-primary border border-border-subtle text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-electric-500" />
              <span>Download (.txt)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-panel-subtle transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Diff Canvas */}
        <div className="flex-1 overflow-y-auto font-mono text-xs p-4">
          {viewMode === "split" ? (
            /* Split Side-by-Side View */
            <div className="grid grid-cols-2 gap-3 min-h-[400px]">
              {/* Left Column: Original */}
              <div className="rounded-2xl border border-border-subtle bg-panel-subtle/30 overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-panel-subtle border-b border-border-subtle flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Original Raw Input</span>
                  </span>
                  <button
                    onClick={handleCopyOriginal}
                    className="text-[11px] text-content-muted hover:text-content-primary flex items-center gap-1"
                  >
                    {copiedOriginal ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedOriginal ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <div className="p-3 divide-y divide-border-subtle/40 overflow-y-auto flex-1">
                  {diffLines.map((row) => (
                    <div
                      key={`orig-${row.lineNum}`}
                      className={`flex items-start gap-3 py-1.5 px-2 rounded-lg transition-colors ${
                        row.isDiff ? "bg-rose-500/10 text-rose-600 dark:text-rose-300 font-semibold" : "text-content-secondary"
                      }`}
                    >
                      <span className="w-6 text-right select-none text-content-muted text-[11px]">{row.lineNum}</span>
                      <span className="w-3 select-none text-rose-500 font-bold">{row.isDiff ? "-" : " "}</span>
                      <span className="flex-1 whitespace-pre-wrap break-all">{row.orig || " "}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Corrected */}
              <div className="rounded-2xl border border-border-subtle bg-panel-subtle/30 overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-panel-subtle border-b border-border-subtle flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Corrected Normalized Output</span>
                  </span>
                  <button
                    onClick={handleCopyCorrected}
                    className="text-[11px] text-content-muted hover:text-content-primary flex items-center gap-1"
                  >
                    {copiedCorrected ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCorrected ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <div className="p-3 divide-y divide-border-subtle/40 overflow-y-auto flex-1">
                  {diffLines.map((row) => (
                    <div
                      key={`corr-${row.lineNum}`}
                      className={`flex items-start gap-3 py-1.5 px-2 rounded-lg transition-colors ${
                        row.isDiff ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-semibold" : "text-content-secondary"
                      }`}
                    >
                      <span className="w-6 text-right select-none text-content-muted text-[11px]">{row.lineNum}</span>
                      <span className="w-3 select-none text-emerald-500 font-bold">{row.isDiff ? "+" : " "}</span>
                      <span className="flex-1 whitespace-pre-wrap break-all">{row.corr || " "}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Unified View */
            <div className="rounded-2xl border border-border-subtle bg-panel-subtle/30 overflow-hidden p-3 divide-y divide-border-subtle/40">
              {diffLines.map((row) => (
                <React.Fragment key={`unified-${row.lineNum}`}>
                  {row.isDiff ? (
                    <>
                      <div className="flex items-start gap-3 py-1.5 px-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-300 font-semibold">
                        <span className="w-6 text-right select-none text-content-muted text-[11px]">{row.lineNum}</span>
                        <span className="w-3 select-none text-rose-500 font-bold">-</span>
                        <span className="flex-1 whitespace-pre-wrap break-all">{row.orig}</span>
                      </div>
                      <div className="flex items-start gap-3 py-1.5 px-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-semibold">
                        <span className="w-6 text-right select-none text-content-muted text-[11px]">{row.lineNum}</span>
                        <span className="w-3 select-none text-emerald-500 font-bold">+</span>
                        <span className="flex-1 whitespace-pre-wrap break-all">{row.corr}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-3 py-1.5 px-2 text-content-secondary">
                      <span className="w-6 text-right select-none text-content-muted text-[11px]">{row.lineNum}</span>
                      <span className="w-3 select-none text-content-muted"> </span>
                      <span className="flex-1 whitespace-pre-wrap break-all">{row.orig}</span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Footer Metrics */}
        <div className="p-4 border-t border-border-subtle bg-panel-subtle/40 flex items-center justify-between text-xs text-content-secondary">
          <div className="flex items-center gap-3">
            <span>Original: <strong>{originalText.length}</strong> chars</span>
            <span>•</span>
            <span>Corrected: <strong>{correctedText.length}</strong> chars</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Net Change: {correctedText.length - originalText.length} chars
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-electric-600 hover:bg-electric-500 text-white font-semibold transition-colors shadow-sm"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
}
