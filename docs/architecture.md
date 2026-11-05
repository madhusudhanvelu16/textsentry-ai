# TextSentry AI — System Architecture

**Title:** Text Error Identification and Correction Using Regular Expressions and Deterministic Finite Automata  
**Subject:** Theory of Computation Academic Case Study  
**Platform:** Next.js (TypeScript, React 19, Tailwind CSS) + FastAPI (Python 3.14)

---

## 1. High-Level System Architecture

TextSentry AI is decoupled into an asynchronous frontend client and a high-performance Python FastAPI engine.

```
+-----------------------------------------------------------------------------------+
|                              Next.js Frontend (Port 3000)                         |
|                                                                                   |
|  [ Overview Dashboard ]   [ Interactive Editor ]   [ Error Breakdown (6 Types) ]  |
|  [ Regex Explorer ]       [ DFA Visualizer ]       [ RE vs DFA Performance Lab ]  |
|  [ Test Cases Bench ]     [ Academic Report Hub ]                                 |
+-----------------------------------------------------------------------------------+
                                        |  REST HTTP / JSON (/api/*)
                                        v
+-----------------------------------------------------------------------------------+
|                             FastAPI Backend (Port 8000)                           |
|                                                                                   |
|  +------------------------+  +------------------------+  +---------------------+  |
|  |   regex_engine.py      |  |     dfa_engine.py      |  | correction_engine.py|  |
|  | 6 Pattern Formulations |  | M=(Q, Σ, δ, q0, F)     |  | Conflict-Free Edits |  |
|  | Lookarounds / Flags    |  | NO regex libraries     |  | Staged Normalization|  |
|  +------------------------+  +------------------------+  +---------------------+  |
|               |                           |                          |            |
|               +-------------+-------------+--------------------------+            |
|                             |                                                     |
|              +-----------------------------+                                      |
|              |  benchmark.py & test_runner |                                      |
|              |  time.perf_counter_ns()      |                                      |
|              |  18 Automated Test Cases    |                                      |
|              +-----------------------------+                                      |
+-----------------------------------------------------------------------------------+
```

---

## 2. Backend Modules & Theoretical Roles

### 2.1 `app/services/regex_engine.py`
Implements the six mandatory formal error categories:
1. `lowercase_sentence_start`: `(?m)(?:^|(?<=[.!?]))[ \t]*([a-z])`
2. `lowercase_pronoun_i`: `(?<![A-Za-z])i(?![A-Za-z])`
3. `multiple_spaces`: ` {2,}`
4. `repeated_words`: `\b([A-Za-z]+)[ \t]+\1\b` (`re.IGNORECASE`)
5. `missing_space_after_punct`: `(?<=[,.;:!?])(?=[A-Za-z])`
6. `space_before_punct`: ` +(?=[,.;:!?])`

Outputs 0-based character offsets, 1-based line/column numbers, surrounding context excerpts, and suggested corrections.

### 2.2 `app/services/dfa_engine.py`
A pure Python Deterministic Finite Automaton implementation **without importing or invoking the `re` module**.
- Implements formal 5-tuple $M = (Q, \Sigma, \delta, q_0, F)$
- States: $Q = \{q_0, q_1, q_2, q_{\text{dead}}\}$
- Alphabet: $\Sigma = \{\text{SPACE}, \text{OTHER}\}$
- Start state: $q_0$
- Accepting states: $F = \{q_2\}$
- Operates in two modes:
  1. **Formal String Recognizer:** Consumes input string $w$ sequentially from $q_0$ to test $w \in L(M)$.
  2. **Document Stream Scanner:** Scans a document stream, tracks continuous spaces entering $q_1$ and $q_2$, emits maximal matching spans upon encountering an `OTHER` character or EOF, and cleanly resets state to $q_0$.

### 2.3 `app/services/correction_engine.py`
Provides conflict-free document correction:
- Resolves overlapping and contiguous errors without offset-drift artifacts.
- Multi-stage normalization order:
  1. Deduplicate repeated words
  2. Remove unnecessary pre-punctuation spacing
  3. Insert missing post-punctuation spacing
  4. Collapse multiple spaces to single spaces
  5. Capitalize standalone pronoun `'i'` $\to$ `'I'`
  6. Capitalize sentence initial letters following punctuation terminators or line starts.
- Selective correction: Right-to-left substitution along the string ensuring earlier character offsets remain unaffected.

### 2.4 `app/services/benchmark.py`
Performs nanosecond-resolution timing experiments:
- Uses `time.perf_counter_ns()` with warm-up cycles.
- Generates controlled benchmark corpora: 1 KB, 10 KB, 100 KB, 1 MB.
- Computes verifiable Lines of Code (LOC) metrics directly from engine source files.

---

## 3. Frontend Architecture

- **Next.js 15 App Router** with TypeScript strict mode.
- **Tailwind CSS** with custom dark theme palette (`navy-950`, `electric-500`, `violetAccent-500`).
- **Interactive SVG Automata Engine:** Dynamic state node glowing, directed transition markers, and step-by-step playback controls.
- **Recharts Data Visualization:** Real-time multi-scale performance curves and error category distribution charts.
- **Academic Export System:** Direct download of TXT, CSV, JSON, and formatted printable academic PDF analysis reports.

