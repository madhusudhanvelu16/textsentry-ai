"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { OverviewDashboard } from "../components/dashboard/OverviewDashboard";
import { InteractiveEditor } from "../components/editor/InteractiveEditor";
import { ErrorBreakdown } from "../components/errors/ErrorBreakdown";
import { PatternExplorer } from "../components/patterns/PatternExplorer";
import { DFALab } from "../components/dfa/DFALab";
import { PerformanceLab } from "../components/performance/PerformanceLab";
import { TestingDashboard } from "../components/testing/TestingDashboard";
import { AcademicReportExport } from "../components/export/AcademicReportExport";
import { AnalysisResult, CompareResult, PatternDefinition } from "../types";
import { api } from "../lib/api";

const DEFAULT_SAMPLE_TEXT = `welcome to the the campus.  i am a a student.
this is  an example,with errors  in spacing .
the course is is useful.hello,world!
can you  fix this ? i i think so.`;

export default function Home() {
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [isDark, setIsDark] = useState<boolean>(true);
  const [backendHealthy, setBackendHealthy] = useState<boolean>(false);

  // Core Document State
  const [text, setText] = useState<string>(DEFAULT_SAMPLE_TEXT);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [compareData, setCompareData] = useState<CompareResult | null>(null);
  const [patterns, setPatterns] = useState<PatternDefinition[]>([]);
  const [correctionsCount, setCorrectionsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Toggle theme class on HTML element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Read URL search params on client mount for direct navigation
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) {
        setCurrentTab(tab);
      }
      const themeParam = params.get("theme");
      if (themeParam === "light") {
        setIsDark(false);
      } else if (themeParam === "dark") {
        setIsDark(true);
      }
    }
  }, []);

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Initial Health & Patterns check
  useEffect(() => {
    const initBackend = async () => {
      try {
        const health = await api.getHealth();
        if (health.status === "healthy") {
          setBackendHealthy(true);
        }
      } catch (e) {
        console.warn("Backend not yet reachable:", e);
        setBackendHealthy(false);
      }

      try {
        const patList = await api.getPatterns();
        setPatterns(patList);
      } catch (e) {
        console.error("Failed to load pattern definitions:", e);
      }
    };

    initBackend();
  }, []);

  // Analyze function
  const handleAnalyze = useCallback(
    async (overrideText?: string) => {
      const targetText = overrideText !== undefined ? overrideText : text;
      setIsLoading(true);
      try {
        const result = await api.analyzeText(targetText);
        setAnalysis(result);
        setBackendHealthy(true);
      } catch (e) {
        console.error("Analysis execution failed:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [text]
  );

  // Run initial analysis on default sample once backend is ready
  useEffect(() => {
    handleAnalyze(DEFAULT_SAMPLE_TEXT);
  }, [handleAnalyze]);

  // Load sample document
  const handleLoadSample = async () => {
    try {
      const sample = await api.getSampleDocument();
      setText(sample.erroneous_text);
      await handleAnalyze(sample.erroneous_text);
    } catch {
      setText(DEFAULT_SAMPLE_TEXT);
      await handleAnalyze(DEFAULT_SAMPLE_TEXT);
    }
  };

  // Auto Correct All
  const handleAutoCorrectAll = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const result = await api.correctText({ text });
      setText(result.corrected_text);
      setCorrectionsCount((prev) => prev + result.corrections_applied);
      // Reanalyze
      await handleAnalyze(result.corrected_text);
    } catch (e) {
      console.error("Auto correct error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply single correction by Error ID
  const handleApplySingleCorrection = async (errorId: string) => {
    setIsLoading(true);
    try {
      const result = await api.correctText({
        text,
        selected_error_ids: [errorId],
      });
      setText(result.corrected_text);
      setCorrectionsCount((prev) => prev + result.corrections_applied);
      await handleAnalyze(result.corrected_text);
    } catch (e) {
      console.error("Single correction error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply corrections strictly for a selected category
  const handleApplyCategoryOnly = async (category: string) => {
    setIsLoading(true);
    try {
      const result = await api.correctText({
        text,
        enabled_categories: [category],
      });
      setText(result.corrected_text);
      setCorrectionsCount((prev) => prev + result.corrections_applied);
      await handleAnalyze(result.corrected_text);
    } catch (e) {
      console.error("Category correction error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Upload
  const handleUploadFile = async (file: File) => {
    setIsLoading(true);
    try {
      const uploaded = await api.uploadDocument(file);
      setText(uploaded.text);
      await handleAnalyze(uploaded.text);
    } catch (e: any) {
      alert(`Upload error: ${e.message || "Failed to parse file"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-navy-950 text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={handleSelectTab}
        totalErrors={analysis?.total_errors ?? 0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          isDark={isDark}
          setIsDark={setIsDark}
          backendHealthy={backendHealthy}
          totalErrors={analysis?.total_errors ?? 0}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Section 1: Overview Dashboard */}
          {currentTab === "dashboard" && (
            <OverviewDashboard
              analysis={analysis}
              correctionsCount={correctionsCount}
              onLoadSample={handleLoadSample}
              onAnalyze={() => handleAnalyze()}
              onNavigateToEditor={() => handleSelectTab("editor")}
              onNavigateToDFA={() => handleSelectTab("dfa")}
              isLoading={isLoading}
            />
          )}

          {/* Section 2: Interactive Text Editor */}
          {currentTab === "editor" && (
            <InteractiveEditor
              text={text}
              setText={setText}
              analysis={analysis}
              onAnalyze={handleAnalyze}
              onAutoCorrectAll={handleAutoCorrectAll}
              onApplySingleCorrection={handleApplySingleCorrection}
              onLoadSample={handleLoadSample}
              onUploadFile={handleUploadFile}
              isLoading={isLoading}
            />
          )}

          {/* Section 3: Error Detection & Breakdown */}
          {currentTab === "errors" && (
            <ErrorBreakdown
              analysis={analysis}
              onApplyCategoryOnly={handleApplyCategoryOnly}
              isLoading={isLoading}
            />
          )}

          {/* Section 4: Regex Pattern Explorer */}
          {currentTab === "patterns" && <PatternExplorer patterns={patterns} />}

          {/* Section 5: DFA Visualization & Lab */}
          {currentTab === "dfa" && <DFALab documentText={text} />}

          {/* Section 6: RE vs DFA Performance Lab */}
          {currentTab === "performance" && <PerformanceLab documentText={text} />}

          {/* Section 7: Test Cases & Validation */}
          {currentTab === "testing" && <TestingDashboard />}

          {/* Section 8: Academic Report & Export */}
          {currentTab === "export" && (
            <AcademicReportExport
              originalText={text}
              correctedText={analysis?.corrected_preview || text}
              analysis={analysis}
              compareData={compareData}
              patterns={patterns}
            />
          )}
        </main>
      </div>
    </div>
  );
}
