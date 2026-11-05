# Comparative Analysis: Regular Expressions vs Deterministic Finite Automata

**Case Study Target Pattern:** Multiple Consecutive Spaces (` {2,}`)  
**Experiment Hardware:** Intel/AMD x86_64, Windows, Python 3.14 + Next.js

---

## 1. Empirical Benchmark Results

Measured using Python's high-resolution `time.perf_counter_ns()` with warm-up cycles across controlled corpora containing periodic repeated space runs:

| Dataset Scale | Character Count | Regex Median (`re.finditer`) | DFA Median (`scan_document_dfa`) | Agreement Check | Matches Identified |
|:---|:---:|:---:|:---:|:---:|:---:|
| **1 KB** | ~962 chars | **0.026 ms** | **0.297 ms** | 100% Equal Spans | 39 |
| **10 KB** | ~10,212 chars | **0.251 ms** | **3.555 ms** | 100% Equal Spans | 414 |
| **100 KB** | ~102,342 chars | **1.601 ms** | **32.204 ms** | 100% Equal Spans | 4,149 |
| **1 MB** | ~1,048,506 chars | **30.294 ms** | **364.648 ms** | 100% Equal Spans | 42,507 |

---

## 2. Theoretical Complexity vs Practical Execution

### 2.1 Time Complexity
- **DFA Scanner:** Guaranteed strict $O(N)$ linear time complexity. For an input string of length $N$, exactly $N$ character examinations and state transitions are executed. There is zero backtracking, regardless of input shape.
- **Regex (` {2,}`):** Also achieves $O(N)$ linear matching for this specific pattern. However, for more complex patterns with backreferences (e.g. `\b([A-Za-z]+)[ \t]+\1\b`), regular expression matching can degrade into exponential or polynomial time ($O(N^2)$ or $O(2^N)$) causing Catastrophic Backtracking (ReDoS).

### 2.2 Why C-Compiled Regex Outperforms Pure Python DFA in Clock Time
A critical academic insight from this experiment is that **empirical clock time does not equal algorithmic complexity**:
1. **Low-Level Vectorization:** Python's built-in `re` module is implemented in optimized C (the SRE engine). It leverages CPU cache locality, SIMD vector instructions, and raw memory pointers.
2. **Interpreter Overhead:** The custom DFA engine runs inside the Python Virtual Machine, executing Python bytecode dispatch per character and dictionary state lookups.
3. **Conclusion:** While DFA guarantees formal $O(N)$ safety, C-level implementation details dominate wall-clock execution time for trivial patterns.

---

## 3. Engineering Metrics & Maintainability

| Metric | Regular Expression Engine | Deterministic Finite Automaton |
|:---|:---|:---|
| **Source File** | `backend/app/services/regex_engine.py` | `backend/app/services/dfa_engine.py` |
| **Lines of Code (LOC)** | 306 code lines (6 patterns) | 149 code lines (1 pattern) |
| **Expressive Power** | High (lookaheads, lookbehinds, backreferences) | Strictly Regular Languages $L \in \text{REG}$ |
| **Backtracking Safety** | Vulnerable if patterns are poorly constructed | $100\%$ immune to backtracking (ReDoS) |
| **Hardware Synthesizability** | Difficult (requires stack and backtracking) | Direct mapping to FPGA / ASIC state registers |
| **Ease of Modification** | Modify pattern string in seconds | Requires recalculating transition matrix $\delta$ |

