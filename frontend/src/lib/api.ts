import {
  AnalysisResult,
  CorrectionRequest,
  CorrectionResult,
  DFAScanResult,
  DFASimulateResult,
  CompareResult,
  PatternDefinition,
  TestSuiteReport,
} from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://textsentry-ai-backend.onrender.com";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let message = `API Error ${response.status}: ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.detail) message = parsed.detail;
    } catch {
      if (errorBody) message = errorBody;
    }
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  getHealth: () => fetchJSON<{ status: string; service: string; version: string }>("/api/health"),

  getPatterns: () => fetchJSON<PatternDefinition[]>("/api/patterns"),

  getSampleDocument: () =>
    fetchJSON<{ erroneous_text: string; expected_corrected_text: string }>("/api/sample"),

  analyzeText: (text: string) =>
    fetchJSON<AnalysisResult>("/api/analyze", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  correctText: (payload: CorrectionRequest) =>
    fetchJSON<CorrectionResult>("/api/correct", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  scanDFA: (text: string) =>
    fetchJSON<DFAScanResult>("/api/dfa/scan", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  simulateDFA: (inputString: string) =>
    fetchJSON<DFASimulateResult>("/api/dfa/simulate", {
      method: "POST",
      body: JSON.stringify({ input_string: inputString }),
    }),

  compareRegexAndDFA: (text: string, includeBenchmarks: boolean = true) =>
    fetchJSON<CompareResult>("/api/compare", {
      method: "POST",
      body: JSON.stringify({ text, include_benchmarks: includeBenchmarks }),
    }),

  runTests: () => fetchJSON<TestSuiteReport>("/api/tests/run"),

  uploadDocument: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const fullUrl = `${BASE_URL}/api/upload`;
    const response = await fetch(fullUrl, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || "Failed to upload file");
    }
    return response.json() as Promise<{ filename: string; char_count: number; text: string }>;
  },
};

