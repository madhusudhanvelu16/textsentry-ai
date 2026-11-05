"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  Play,
  RotateCcw,
  Sparkles,
  Undo2,
  Redo2,
  Trash2,
  Upload,
  Copy,
  Download,
  Check,
  SplitSquareVertical,
  Filter,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
} from "lucide-react";
import { DetectedError, AnalysisResult } from "../../types";
import { ErrorPopover } from "./ErrorPopover";
import { SideBySideModal } from "./SideBySideModal";

interface InteractiveEditorProps {
  text: string;
  setText: (text: string) => void;
  analysis: AnalysisResult | null;
  onAnalyze: (textToAnalyze?: string) => Promise<void>;
  onAutoCorrectAll: () => Promise<void>;
  onApplySingleCorrection: (errorId: string) => Promise<void>;
  onLoadSample: () => void;
  onUploadFile: (file: File) => Promise<void>;
  isLoading: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  lowercase_sentence_start: {
    bg: "rgba(239, 68, 68, 0.2)",
    border: "border-b-2 border-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    label: "Sentence Lowercase",
  },
  lowercase_pronoun_i: {
    bg: "rgba(245, 158, 11, 0.2)",
    border: "border-b-2 border-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    label: "Pronoun 'i'",
  },
  multiple_spaces: {
    bg: "rgba(59, 130, 246, 0.25)",
    border: "border-b-2 border-electric-500",
    text: "text-electric-600 dark:text-electric-400",
    label: "Multiple Spaces",
  },
  repeated_words: {
    bg: "rgba(139, 92, 246, 0.2)",
    border: "border-b-2 border-violetAccent-500",
    text: "text-violetAccent-600 dark:text-violetAccent-400",
    label: "Repeated Words",
  },
  missing_space_after_punct: {
    bg: "rgba(16, 185, 129, 0.2)",
    border: "border-b-2 border-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    label: "Missing Space",
  },
  space_before_punct: {
    bg: "rgba(236, 72, 153, 0.2)",
    border: "border-b-2 border-pink-500",
    text: "text-pink-600 dark:text-pink-400",
    label: "Space Before Punct",
  },
};

export function InteractiveEditor({
  text,
  setText,
  analysis,
  onAnalyze,
  onAutoCorrectAll,
  onApplySingleCorrection,
  onLoadSample,
  onUploadFile,
  isLoading,
}: InteractiveEditorProps) {
  // Viewing mode: "inspector" (annotated interactive view) vs "raw" (textarea input)
  const [editorMode, setEditorMode] = useState<"inspector" | "raw">("inspector");

  // Undo / Redo history state
  const [history, setHistory] = useState<string[]>([text]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Active filter tab
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  // Ignored error IDs
  const [ignoredErrorIds, setIgnoredErrorIds] = useState<Set<string>>(new Set());

  // Active inspected error for popover
  const [activeError, setActiveError] = useState<DetectedError | null>(null);

  // Side-by-side comparison modal state
  const [isSideBySideOpen, setIsSideBySideOpen] = useState(false);

  // Copy feedback state
  const [copiedCorrected, setCopiedCorrected] = useState(false);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Synchronize history when text changes
  const updateTextWithHistory = (newText: string) => {
    if (newText === text) return;
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(newText);
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
    setText(newText);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const target = historyIndex - 1;
      setHistoryIndex(target);
      setText(history[target]);
      onAnalyze(history[target]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const target = historyIndex + 1;
      setHistoryIndex(target);
      setText(history[target]);
      onAnalyze(history[target]);
    }
  };

  // Filter visible errors
  const activeErrors = useMemo(() => {
    if (!analysis) return [];
    return analysis.errors.filter((e) => {
      if (ignoredErrorIds.has(e.id)) return false;
      if (selectedCategoryFilter !== "all" && e.category !== selectedCategoryFilter) return false;
      return true;
    });
  }, [analysis, ignoredErrorIds, selectedCategoryFilter]);

  // Compute line numbers
  const lineCount = useMemo(() => {
    return text ? text.split("\n").length : 1;
  }, [text]);

  const handleCopyCorrected = () => {
    if (!analysis?.corrected_preview) return;
    navigator.clipboard.writeText(analysis.corrected_preview);
    setCopiedCorrected(true);
    setTimeout(() => setCopiedCorrected(false), 2000);
  };

  const handleDownloadCorrected = () => {
    const content = analysis?.corrected_preview || text;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "textsentry_corrected.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUploadFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleIgnore = (errorId: string) => {
    setIgnoredErrorIds((prev) => new Set([...prev, errorId]));
    setActiveError(null);
  };

  // Find overlapping errors at the position of activeError
  const overlappingErrors = useMemo(() => {
    if (!activeError || !analysis) return [];
    return analysis.errors.filter(
      (e) =>
        e.id !== activeError.id &&
        !ignoredErrorIds.has(e.id) &&
        Math.max(e.start, activeError.start) <
          Math.min(Math.max(e.end, e.start + 1), Math.max(activeError.end, activeError.start + 1))
    );
  }, [activeError, analysis, ignoredErrorIds]);

  // Render annotated text buffer with clickable error spans
  const annotatedContent = useMemo(() => {
    if (!analysis || !text) return text;
    const errorsToRender = analysis.errors.filter((e) => !ignoredErrorIds.has(e.id));
    if (errorsToRender.length === 0) return text;

    // Build non-overlapping boundary tokens
    const sorted = [...errorsToRender].sort((a, b) => a.start - b.start || b.end - a.end);
    const elements: React.ReactNode[] = [];
    let lastIdx = 0;

    for (let i = 0; i < sorted.length; i++) {
      const err = sorted[i];
      if (err.start < lastIdx) {
        // Skip nested overlaps in visual inline view (they remain accessible via popover)
        continue;
      }

      // Preceding normal text
      if (err.start > lastIdx) {
        elements.push(
          <span key={`txt-${lastIdx}-${err.start}`}>
            {text.substring(lastIdx, err.start)}
          </span>
        );
      }

      const styleMeta = CATEGORY_COLORS[err.category];

      if (err.is_zero_width) {
        // Zero-width boundary marker (e.g. missing space after punctuation)
        elements.push(
          <span
            key={err.id}
            onClick={() => setActiveError(err)}
            className="inline-flex items-center px-1 py-0.5 mx-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer hover:bg-emerald-500/30 transition-all border border-emerald-500/40 text-xs"
            title={`Missing space after punctuation: click to inspect`}
          >
            [+␣]
          </span>
        );
      } else {
        // Normal highlighted span
        const spanText = text.substring(err.start, err.end);
        elements.push(
          <span
            key={err.id}
            onClick={() => setActiveError(err)}
            style={{ backgroundColor: styleMeta?.bg }}
            className={`px-1 py-0.5 rounded cursor-pointer transition-all hover:ring-2 hover:ring-electric-500/60 font-semibold ${
              styleMeta?.border || "border-b-2 border-electric-500"
            } ${styleMeta?.text || "text-content-primary"}`}
            title={`Click to inspect ${err.pattern_name}`}
          >
            {err.category === "multiple_spaces" ? `[${spanText.length} spaces]` : spanText}
          </span>
        );
      }

      lastIdx = Math.max(lastIdx, err.end);
    }

    // Trailing text
    if (lastIdx < text.length) {
      elements.push(
        <span key={`txt-${lastIdx}-end`}>
          {text.substring(lastIdx)}
        </span>
      );
    }

    return elements;
  }, [text, analysis, ignoredErrorIds]);

  return (
    <div className="space-y-6">
      {/* Top Action Toolbar */}
      <div className="glass-panel rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-card">
        {/* Left Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onLoadSample}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-panel hover:bg-panel-subtle text-content-primary border border-border-subtle hover:border-border-muted text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            title="Load the 23-error case study benchmark"
          >
            <RotateCcw className="w-3.5 h-3.5 text-electric-500" />
            <span>Load Sample (23 Errors)</span>
          </button>

          <button
            onClick={() => onAnalyze()}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-electric-600 to-electric-500 hover:from-electric-500 hover:to-electric-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-glow disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Analyze Text</span>
          </button>

          <button
            onClick={onAutoCorrectAll}
            disabled={isLoading || analysis?.total_errors === 0}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto Correct All</span>
          </button>

          <div className="h-6 w-px bg-border-subtle mx-1 hidden sm:block" />

          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-xl bg-panel-subtle border border-border-subtle hover:border-border-muted text-content-secondary disabled:opacity-30 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-xl bg-panel-subtle border border-border-subtle hover:border-border-muted text-content-secondary disabled:opacity-30 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => updateTextWithHistory("")}
            className="p-2 rounded-xl bg-panel-subtle border border-border-subtle hover:bg-rose-500/10 hover:border-rose-500/30 text-content-muted hover:text-rose-500 transition-colors"
            title="Clear Editor"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* File Upload */}
          <label className="cursor-pointer px-3 py-2 rounded-xl bg-panel-subtle hover:bg-panel-muted border border-border-subtle text-content-secondary text-xs font-medium flex items-center gap-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5 text-violetAccent-500" />
            <span>Upload (.txt / .docx)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Right Output Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSideBySideOpen(true)}
            disabled={!analysis?.corrected_preview}
            className="px-3.5 py-2 rounded-xl bg-panel hover:bg-panel-subtle border border-border-subtle text-content-primary text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <SplitSquareVertical className="w-3.5 h-3.5 text-electric-500" />
            <span>Side-by-Side Diff</span>
          </button>

          <button
            onClick={handleCopyCorrected}
            disabled={!analysis?.corrected_preview}
            className="px-3 py-2 rounded-xl bg-panel hover:bg-panel-subtle border border-border-subtle text-content-primary text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            {copiedCorrected ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-content-muted" />
                <span>Copy Corrected</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadCorrected}
            disabled={!analysis?.corrected_preview}
            className="px-3 py-2 rounded-xl bg-panel hover:bg-panel-subtle border border-border-subtle text-content-primary text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-content-muted" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Editor Main Canvas with Dual Mode: Inspector vs Raw */}
      <div className="relative glass-panel rounded-3xl overflow-hidden shadow-card flex flex-col">
        {/* Editor Title Bar */}
        <div className="px-5 py-3 border-b border-border-subtle bg-panel-subtle/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-content-secondary">
            <span className="font-semibold text-content-primary">Document Buffer</span>
            <span>•</span>
            <span className="font-mono">{text.length} characters</span>
            <span>•</span>
            <span className="font-mono">{lineCount} lines</span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-panel p-1 rounded-xl border border-border-subtle text-xs font-semibold">
              <button
                onClick={() => setEditorMode("inspector")}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                  editorMode === "inspector"
                    ? "bg-electric-600 text-white shadow-sm"
                    : "text-content-secondary hover:text-content-primary"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Interactive Inspector</span>
              </button>
              <button
                onClick={() => setEditorMode("raw")}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                  editorMode === "raw"
                    ? "bg-electric-600 text-white shadow-sm"
                    : "text-content-secondary hover:text-content-primary"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Raw Source Edit</span>
              </button>
            </div>

            {analysis?.total_errors === 0 && text.trim().length > 0 && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% Verified (0 Errors)</span>
              </span>
            )}

            {analysis && analysis.total_errors > 0 && (
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold text-xs bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/30">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{activeErrors.length} Active Errors</span>
              </span>
            )}
          </div>
        </div>

        {/* Editor Body: Gutter + Text/Inspector */}
        <div className="relative flex min-h-[340px] bg-canvas font-mono text-sm">
          {/* Line Numbers Gutter */}
          <div className="w-12 py-4 select-none text-right pr-3 bg-panel-subtle/40 border-r border-border-subtle text-content-muted font-mono text-xs leading-7">
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Content Pane */}
          <div className="relative flex-1 p-4 leading-7">
            {editorMode === "inspector" ? (
              /* Interactive Annotated Highlighting View */
              <div className="w-full h-full min-h-[300px] whitespace-pre-wrap font-mono text-content-primary select-text">
                {annotatedContent}
              </div>
            ) : (
              /* Raw Source Textarea */
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => updateTextWithHistory(e.target.value)}
                placeholder="Paste or type text here to analyze grammatical and spacing errors, or click 'Load Sample (23 Errors)'..."
                className="w-full h-full min-h-[300px] bg-transparent text-content-primary placeholder:text-content-muted resize-y focus:outline-none leading-7 font-mono"
                spellCheck={false}
              />
            )}

            {/* Error Popover Anchor Overlay */}
            {activeError && (
              <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
                <div className="pointer-events-auto">
                  <ErrorPopover
                    error={activeError}
                    overlappingErrors={overlappingErrors}
                    onSelectError={(err) => setActiveError(err)}
                    onApply={async (errId) => {
                      await onApplySingleCorrection(errId);
                      setActiveError(null);
                    }}
                    onIgnore={handleIgnore}
                    onClose={() => setActiveError(null)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Tabs & Interactive Error Inspector Panel */}
      <div className="glass-panel rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-electric-500" />
            <h3 className="text-sm font-bold text-content-primary">Detected Error Annotations</h3>
            <span className="text-xs font-mono text-content-muted">
              ({activeErrors.length} matching filter)
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setSelectedCategoryFilter("all")}
              className={`px-3 py-1 rounded-xl font-medium transition-colors ${
                selectedCategoryFilter === "all"
                  ? "bg-electric-600 text-white font-semibold shadow-sm"
                  : "bg-panel-subtle text-content-secondary hover:text-content-primary"
              }`}
            >
              All ({analysis?.total_errors ?? 0})
            </button>

            {Object.entries(CATEGORY_COLORS).map(([catKey, catMeta]) => {
              const count = analysis?.category_counts[catKey] ?? 0;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategoryFilter(catKey)}
                  className={`px-3 py-1 rounded-xl font-medium transition-colors flex items-center gap-1.5 ${
                    selectedCategoryFilter === catKey
                      ? "bg-panel text-content-primary border border-border-muted font-semibold shadow-sm"
                      : "bg-panel-subtle text-content-secondary hover:text-content-primary"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: catMeta.text.includes("rose") ? "#ef4444" : catMeta.text.includes("amber") ? "#f59e0b" : catMeta.text.includes("electric") ? "#3b82f6" : catMeta.text.includes("violet") ? "#8b5cf6" : catMeta.text.includes("emerald") ? "#10b981" : "#ec4899" }}
                  />
                  <span>{catMeta.label}</span>
                  <span className="font-mono text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Items List */}
        {activeErrors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-96 overflow-y-auto pr-1">
            {activeErrors.map((err) => {
              const catMeta = CATEGORY_COLORS[err.category];
              return (
                <div
                  key={err.id}
                  onClick={() => setActiveError(err)}
                  className="p-4 rounded-2xl bg-panel-subtle/60 hover:bg-panel border border-border-subtle hover:border-border-muted transition-all cursor-pointer flex flex-col justify-between group shadow-subtle hover:shadow-card"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${catMeta?.bg || "bg-panel-muted"} ${catMeta?.text || "text-content-primary"}`}
                      >
                        {catMeta?.label || err.category}
                      </span>
                      <span className="text-[11px] font-mono text-content-muted">
                        Line {err.line}:{err.column}
                      </span>
                    </div>

                    <div className="font-mono text-xs text-content-primary flex items-center gap-2 mb-1.5">
                      <span className="text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                        {err.is_zero_width ? "[Zero-Width]" : `"${err.matched_text}"`}
                      </span>
                      <span className="text-content-muted">→</span>
                      <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                        {err.suggested_correction === "" ? "[Remove]" : `"${err.suggested_correction}"`}
                      </span>
                    </div>

                    <p className="text-[11px] text-content-secondary line-clamp-2 leading-relaxed">
                      {err.explanation}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs">
                    <span className="text-[10px] text-content-muted font-mono">
                      Offset [{err.start}..{err.end}]
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIgnore(err.id);
                        }}
                        className="text-[11px] text-content-muted hover:text-content-primary transition-colors"
                      >
                        Ignore
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onApplySingleCorrection(err.id);
                        }}
                        className="px-3 py-1 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white font-semibold text-[11px] transition-all border border-emerald-500/30 shadow-sm"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-content-muted space-y-2 border border-dashed border-border-muted rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <p className="text-xs font-medium text-content-primary">
              {text.trim() === ""
                ? "No text in editor. Type or load a sample document."
                : "No errors matching the active category filter!"}
            </p>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Modal */}
      <SideBySideModal
        isOpen={isSideBySideOpen}
        onClose={() => setIsSideBySideOpen(false)}
        originalText={text}
        correctedText={analysis?.corrected_preview || text}
        onDownloadCorrected={handleDownloadCorrected}
      />
    </div>
  );
}
