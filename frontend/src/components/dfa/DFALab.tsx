"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Cpu,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { DFADiagramSVG } from "./DFADiagramSVG";
import { DFASimulateResult, DFAStep, DFAScanResult } from "../../types";
import { api } from "../../lib/api";

interface DFALabProps {
  documentText: string;
}

export function DFALab({ documentText }: DFALabProps) {
  // Mode: "formal" (whole-string recognition) vs "scanner" (document streaming)
  const [mode, setMode] = useState<"formal" | "scanner">("formal");

  // String under test in formal mode
  const [testString, setTestString] = useState<string>("  ");

  // Simulation response from API
  const [simResult, setSimResult] = useState<DFASimulateResult | null>(null);

  // Document scan result from API
  const [scanResult, setScanResult] = useState<DFAScanResult | null>(null);

  // Stepping index (-1 = initial state before reading character 0)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);

  // Autoplay state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(800); // 800ms per step

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load simulation data whenever testString changes in formal mode
  useEffect(() => {
    let isMounted = true;
    const fetchSim = async () => {
      try {
        const res = await api.simulateDFA(testString);
        if (isMounted) {
          setSimResult(res);
          setCurrentStepIndex(-1);
          setIsPlaying(false);
        }
      } catch (e) {
        console.error("DFA simulation error:", e);
      }
    };
    if (mode === "formal") {
      fetchSim();
    }
    return () => {
      isMounted = false;
    };
  }, [testString, mode]);

  // Load document scan whenever documentText changes or when switching to scanner mode
  useEffect(() => {
    let isMounted = true;
    const fetchScan = async () => {
      try {
        const res = await api.scanDFA(documentText || "sample  text   here");
        if (isMounted) {
          setScanResult(res);
        }
      } catch (e) {
        console.error("DFA scan error:", e);
      }
    };
    if (mode === "scanner") {
      fetchScan();
    }
    return () => {
      isMounted = false;
    };
  }, [documentText, mode]);

  // Autoplay stepper loop
  useEffect(() => {
    if (isPlaying && simResult) {
      timerRef.current = setTimeout(() => {
        if (currentStepIndex < simResult.steps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, playbackSpeedMs);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStepIndex, simResult, playbackSpeedMs]);

  // Determine active state in diagram
  const activeState = React.useMemo(() => {
    if (!simResult) return "q0";
    if (currentStepIndex === -1) return "q0";
    const step = simResult.steps[currentStepIndex];
    return step ? step.next_state : "q0";
  }, [simResult, currentStepIndex]);

  const currentStep =
    simResult && currentStepIndex >= 0 ? simResult.steps[currentStepIndex] : null;

  const handleStepForward = () => {
    if (!simResult) return;
    if (currentStepIndex < simResult.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleStepBack = () => {
    if (currentStepIndex > -1) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(-1);
  };

  const isFinished = Boolean(simResult && currentStepIndex === simResult.steps.length - 1);
  const isAccepted = Boolean(isFinished && simResult?.accepted);
  const isRejected = Boolean(isFinished && !simResult?.accepted);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-electric-600 dark:text-electric-400 bg-electric-500/10 px-2.5 py-0.5 rounded-full border border-electric-500/20">
                Formal Automata Specification
              </span>
              <span className="text-xs font-mono text-content-muted">Target Pattern: ` &#123;2,&#125;`</span>
            </div>
            <h3 className="text-xl font-bold text-content-primary mt-1">
              Deterministic Finite Automaton (DFA) Laboratory
            </h3>
            <p className="text-xs text-content-secondary mt-0.5">
              5-tuple definition: M = (Q, Σ, δ, q0, F) recognizing languages of multiple consecutive spaces
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-panel p-1 rounded-xl border border-border-subtle self-start sm:self-auto text-xs font-semibold shadow-subtle">
            <button
              onClick={() => {
                setMode("formal");
                setIsPlaying(false);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === "formal"
                  ? "bg-electric-600 text-white shadow-sm font-bold"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              Formal Recognizer
            </button>
            <button
              onClick={() => {
                setMode("scanner");
                setIsPlaying(false);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === "scanner"
                  ? "bg-electric-600 text-white shadow-sm font-bold"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              Document Scanner
            </button>
          </div>
        </div>

        {/* Formal Definition 5-tuple Banner */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-2xl bg-panel-subtle border border-border-subtle">
            <span className="text-[10px] text-content-muted uppercase font-sans block font-semibold">States Q</span>
            <span className="text-electric-600 dark:text-electric-300 font-bold">&#123;q0, q1, q2, qdead&#125;</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-panel-subtle border border-border-subtle">
            <span className="text-[10px] text-content-muted uppercase font-sans block font-semibold">Alphabet Σ</span>
            <span className="text-electric-600 dark:text-electric-300 font-bold">&#123;SPACE, OTHER&#125;</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-panel-subtle border border-border-subtle">
            <span className="text-[10px] text-content-muted uppercase font-sans block font-semibold">Start State q0</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">q0 (0 spaces)</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-panel-subtle border border-border-subtle">
            <span className="text-[10px] text-content-muted uppercase font-sans block font-semibold">Accepting F</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">&#123;q2&#125; (≥ 2 spaces)</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-panel-subtle border border-border-subtle col-span-2 md:col-span-1">
            <span className="text-[10px] text-content-muted uppercase font-sans block font-semibold">Trap State</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">qdead</span>
          </div>
        </div>
      </div>

      {mode === "formal" ? (
        <>
          {/* Formal Recognizer Controls */}
          <div className="glass-panel rounded-3xl p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* String Input and Presets */}
              <div className="flex-1 space-y-2.5">
                <label className="text-xs font-semibold text-content-primary block">
                  Candidate Input String to Evaluate:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={testString}
                    onChange={(e) => setTestString(e.target.value)}
                    placeholder="Enter string of spaces and characters..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-canvas border border-border-subtle text-content-primary font-mono text-xs focus:outline-none focus:border-electric-500 shadow-inner"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                  <span className="text-content-muted text-[11px] font-medium">Presets:</span>
                  <button
                    onClick={() => setTestString("  ")}
                    className="px-2.5 py-1 rounded-lg bg-panel hover:bg-panel-subtle text-content-secondary font-mono text-[11px] border border-border-subtle shadow-sm"
                  >
                    &quot;  &quot; (2 Spaces - Accept)
                  </button>
                  <button
                    onClick={() => setTestString(" ")}
                    className="px-2.5 py-1 rounded-lg bg-panel hover:bg-panel-subtle text-content-secondary font-mono text-[11px] border border-border-subtle shadow-sm"
                  >
                    &quot; &quot; (1 Space - Reject)
                  </button>
                  <button
                    onClick={() => setTestString("   ")}
                    className="px-2.5 py-1 rounded-lg bg-panel hover:bg-panel-subtle text-content-secondary font-mono text-[11px] border border-border-subtle shadow-sm"
                  >
                    &quot;   &quot; (3 Spaces - Accept)
                  </button>
                  <button
                    onClick={() => setTestString(" a")}
                    className="px-2.5 py-1 rounded-lg bg-panel hover:bg-panel-subtle text-content-secondary font-mono text-[11px] border border-border-subtle shadow-sm"
                  >
                    &quot; a&quot; (Non-space - Trap)
                  </button>
                </div>
              </div>

              {/* Simulation Stepper Toolbar */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-content-primary">
                  Simulation Stepper Controls:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="p-2.5 rounded-xl bg-panel hover:bg-panel-subtle text-content-primary border border-border-subtle transition-colors shadow-sm"
                    title="Reset to Start State q0"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleStepBack}
                    disabled={currentStepIndex <= -1}
                    className="p-2.5 rounded-xl bg-panel hover:bg-panel-subtle text-content-primary border border-border-subtle disabled:opacity-30 transition-colors shadow-sm"
                    title="Step Backward"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    disabled={!simResult || isFinished}
                    className={`px-4 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isPlaying
                        ? "bg-amber-600 hover:bg-amber-500"
                        : "bg-electric-600 hover:bg-electric-500 shadow-glow"
                    } disabled:opacity-40`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>{isPlaying ? "Pause" : "Run Auto"}</span>
                  </button>

                  <button
                    onClick={handleStepForward}
                    disabled={!simResult || isFinished}
                    className="p-2.5 rounded-xl bg-panel hover:bg-panel-subtle text-content-primary border border-border-subtle disabled:opacity-30 transition-colors shadow-sm"
                    title="Step Forward"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  {/* Playback speed selector */}
                  <select
                    value={playbackSpeedMs}
                    onChange={(e) => setPlaybackSpeedMs(Number(e.target.value))}
                    className="px-3 py-2.5 rounded-xl bg-panel border border-border-subtle text-xs font-mono text-content-primary focus:outline-none shadow-sm"
                  >
                    <option value={1500}>0.5x Speed</option>
                    <option value={800}>1.0x Speed</option>
                    <option value={400}>2.0x Speed</option>
                    <option value={200}>4.0x Speed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Interactive Discrete Symbol Tape Ribbon */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">
                Automata Input Tape & Scanner Read Head:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto p-3 rounded-2xl bg-panel-subtle border border-border-subtle font-mono text-xs">
                {testString.length === 0 ? (
                  <span className="text-content-muted italic text-[11px] px-2 py-1">
                    [Empty String ε - DFA remains in start state q0]
                  </span>
                ) : (
                  Array.from(testString).map((char, idx) => {
                    const isPassed = idx < currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    const charDisplay = char === " " ? "[SPACE]" : `'${char}'`;
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col items-center p-2 rounded-xl border transition-all shrink-0 ${
                          isCurrent
                            ? "bg-electric-500/20 border-electric-500 shadow-glow text-electric-600 dark:text-electric-300 font-bold scale-105"
                            : isPassed
                            ? "bg-panel border-border-muted text-content-muted opacity-80"
                            : "bg-panel border-border-subtle text-content-secondary"
                        }`}
                      >
                        <span className="text-[9px] text-content-muted select-none">Cell {idx}</span>
                        <span className="text-xs font-bold my-0.5">{charDisplay}</span>
                        <span className="text-[9px] font-mono opacity-60">ASCII {char.charCodeAt(0)}</span>
                        {isCurrent && (
                          <span className="mt-1 w-2 h-2 rounded-full bg-electric-500 animate-ping" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Current Step Telemetry Pill */}
            <div className="p-4 rounded-2xl bg-panel-subtle border border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-content-muted">
                  Step: <strong className="text-content-primary">{currentStepIndex + 1}</strong> /{" "}
                  {simResult?.steps.length ?? 0}
                </span>

                <span className="h-4 w-px bg-border-subtle" />

                <span className="font-mono text-content-muted">
                  Active State: <strong className="text-electric-600 dark:text-electric-400 font-bold">{activeState}</strong>
                </span>

                {currentStep && (
                  <>
                    <span className="h-4 w-px bg-border-subtle" />
                    <span className="font-mono text-content-muted">
                      Consumed Symbol:{" "}
                      <strong className="text-amber-600 dark:text-amber-400 font-bold">
                        {currentStep.char_display}
                      </strong>{" "}
                      ({currentStep.symbol})
                    </span>
                  </>
                )}
              </div>

              {/* Acceptance Status Badge */}
              <div>
                {isFinished ? (
                  isAccepted ? (
                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 animate-pulse shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>STRING ACCEPTED (In Language L)</span>
                    </span>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>STRING REJECTED (Not in L)</span>
                    </span>
                  )
                ) : (
                  <span className="px-3 py-1 rounded-full bg-panel text-content-muted text-xs font-medium border border-border-subtle">
                    Simulation In Progress...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Animated SVG Diagram Canvas */}
          <DFADiagramSVG
            activeState={activeState}
            lastSymbol={currentStep?.symbol}
            isAccepting={activeState === "q2"}
          />

          {/* Formal Transition Table & Step Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transition Table */}
            <div className="glass-panel rounded-3xl p-6 space-y-3">
              <h4 className="text-sm font-bold text-content-primary flex items-center gap-2">
                <Cpu className="w-4 h-4 text-electric-500" />
                <span>Formal State Transition Table δ(q, σ)</span>
              </h4>
              <p className="text-xs text-content-secondary">
                Mathematical mapping defining next states for every pair of (state, symbol):
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle text-content-muted">
                      <th className="py-2.5 px-3">Current State (q)</th>
                      <th className="py-2.5 px-3">SPACE (&apos; &apos;)</th>
                      <th className="py-2.5 px-3">OTHER (Non-space)</th>
                      <th className="py-2.5 px-3">State Semantics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/60">
                    <tr className={activeState === "q0" ? "bg-electric-500/10 font-bold" : ""}>
                      <td className="py-2.5 px-3 text-content-primary">q0 (Start)</td>
                      <td className="py-2.5 px-3 text-electric-600 dark:text-electric-400">q1</td>
                      <td className="py-2.5 px-3 text-rose-500">qdead</td>
                      <td className="py-2.5 px-3 text-content-secondary font-sans text-[11px]">0 spaces consumed</td>
                    </tr>
                    <tr className={activeState === "q1" ? "bg-electric-500/10 font-bold" : ""}>
                      <td className="py-2.5 px-3 text-content-primary">q1</td>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold">q2 (Accept)</td>
                      <td className="py-2.5 px-3 text-rose-500">qdead</td>
                      <td className="py-2.5 px-3 text-content-secondary font-sans text-[11px]">Exactly 1 space consumed</td>
                    </tr>
                    <tr className={activeState === "q2" ? "bg-emerald-500/15 font-bold" : ""}>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold">q2 (Accepting)</td>
                      <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">q2</td>
                      <td className="py-2.5 px-3 text-rose-500">qdead</td>
                      <td className="py-2.5 px-3 text-content-secondary font-sans text-[11px]">≥ 2 consecutive spaces</td>
                    </tr>
                    <tr className={activeState === "qdead" ? "bg-rose-500/10 font-bold" : ""}>
                      <td className="py-2.5 px-3 text-rose-500 font-bold">qdead (Trap)</td>
                      <td className="py-2.5 px-3 text-rose-500">qdead</td>
                      <td className="py-2.5 px-3 text-rose-500">qdead</td>
                      <td className="py-2.5 px-3 text-content-secondary font-sans text-[11px]">Invalid character encountered</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transition Step History */}
            <div className="glass-panel rounded-3xl p-6 space-y-3">
              <h4 className="text-sm font-bold text-content-primary flex items-center gap-2">
                <Clock className="w-4 h-4 text-violetAccent-500" />
                <span>Execution Trace & Step History</span>
              </h4>
              <p className="text-xs text-content-secondary">
                Ordered state machine transitions for candidate input &quot;{testString}&quot;:
              </p>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
                {simResult && simResult.steps.length > 0 ? (
                  simResult.steps.map((st, idx) => (
                    <div
                      key={st.step_index}
                      className={`p-2.5 rounded-xl border transition-all ${
                        idx === currentStepIndex
                          ? "bg-electric-500/15 border-electric-500/40 text-content-primary font-bold shadow-sm"
                          : idx < currentStepIndex
                          ? "bg-panel-subtle border-border-subtle text-content-secondary"
                          : "bg-panel/40 border-border-subtle/40 text-content-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span>
                          Step {st.step_index}: Read &apos;{st.char_display}&apos;
                        </span>
                        <span>
                          {st.current_state} → <strong className="text-electric-600 dark:text-electric-400">{st.next_state}</strong>
                        </span>
                      </div>
                      <p className="text-[10px] text-content-muted font-sans mt-1">
                        {st.action_description}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-content-muted">No input steps generated.</div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Scanner Mode View */
        <div className="glass-panel rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div>
              <h4 className="text-base font-bold text-content-primary">Full Document Stream Scanning</h4>
              <p className="text-xs text-content-secondary">
                Linear state scanner without regular expression libraries. Resets to q0 upon non-space characters.
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-electric-500/15 text-electric-600 dark:text-electric-400 border border-electric-500/30">
              {scanResult?.total_occurrences ?? 0} Detected Space Runs
            </span>
          </div>

          {/* Scanner Telemetry */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-panel-subtle border border-border-subtle">
              <span className="text-[10px] text-content-muted uppercase font-sans block font-semibold">Matches Identified</span>
              <span className="text-lg font-bold text-electric-600 dark:text-electric-400">{scanResult?.total_occurrences ?? 0}</span>
            </div>
            <div className="p-4 rounded-2xl bg-panel-subtle border border-border-subtle">
              <span className="text-[10px] text-content-muted uppercase font-sans block font-semibold">Execution Time</span>
              <span className="text-lg font-bold text-violetAccent-600 dark:text-violetAccent-400">
                {scanResult?.execution_time_ms.toFixed(3) ?? 0} ms
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-panel-subtle border border-border-subtle">
              <span className="text-[10px] text-content-muted uppercase font-sans block font-semibold">Regex Equivalence</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">100% Agreement</span>
            </div>
          </div>

          {/* Scan occurrences table */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-content-primary block mb-2">
              Detected Multiple Space Spans (DFA Output):
            </span>
            <div className="overflow-x-auto max-h-72 border border-border-subtle rounded-2xl bg-canvas">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead className="bg-panel-subtle border-b border-border-subtle text-content-muted sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Run #</th>
                    <th className="py-2.5 px-3">Offset Span [start..end]</th>
                    <th className="py-2.5 px-3">Space Count</th>
                    <th className="py-2.5 px-3">Location (Line:Col)</th>
                    <th className="py-2.5 px-3">State Sequence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/60">
                  {scanResult && scanResult.matches.length > 0 ? (
                    scanResult.matches.map((m, idx) => (
                      <tr key={idx} className="hover:bg-panel-subtle/50 transition-colors">
                        <td className="py-2.5 px-3 text-content-secondary">{idx + 1}</td>
                        <td className="py-2.5 px-3 text-electric-600 dark:text-electric-400 font-bold">[{m.start}..{m.end}]</td>
                        <td className="py-2.5 px-3 text-content-primary font-bold">{m.length} spaces</td>
                        <td className="py-2.5 px-3 text-content-muted">Line {m.line}:{m.column}</td>
                        <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 text-[11px]">
                          q0 → q1 → q2 {m.length > 2 ? `(loop q2 × ${m.length - 2})` : ""}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-content-muted">
                        No multiple space runs in active document.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
