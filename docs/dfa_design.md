# DFA Design and Formal Verification

**Case Study Target Pattern:** Multiple Consecutive Spaces  
**Regular Expression Equivalent:** ` {2,}`  
**Language:** $L = \{ w \in \{\text{SPACE}, \text{OTHER}\}^* \mid w \text{ is a string of two or more ASCII spaces} \}$

---

## 1. Formal Mathematical 5-Tuple

The Deterministic Finite Automaton (DFA) is formally defined as:

$$M = (Q, \Sigma, \delta, q_0, F)$$

Where:
1. **$Q = \{q_0, q_1, q_2, q_{\text{dead}}\}$**: The finite set of states.
   - $q_0$: Initial state (0 spaces consumed).
   - $q_1$: Prefix state (exactly 1 space consumed; non-accepting).
   - $q_2$: Accepting state ($\ge 2$ consecutive spaces consumed).
   - $q_{\text{dead}}$: Trap / dead state (invalid non-space character encountered).
2. **$\Sigma = \{\text{SPACE}, \text{OTHER}\}$**: The input alphabet, where `SPACE` corresponds to ASCII character `0x20` (`' '`), and `OTHER` denotes any non-space character.
3. **$q_0 \in Q$**: The unique starting state.
4. **$F = \{q_2\} \subseteq Q$**: The set of accepting states.
5. **$\delta: Q \times \Sigma \to Q$**: The deterministic transition function.

---

## 2. State Transition Table $\delta$

| Current State $q$ | Input Symbol: `SPACE` (`' '`) | Input Symbol: `OTHER` (Any non-space) | State Semantics |
|:---|:---:|:---:|:---|
| **$q_0$** (Start) | $q_1$ | $q_{\text{dead}}$ | No characters consumed yet |
| **$q_1$** | $q_2$ | $q_{\text{dead}}$ | Exactly 1 space consumed (Non-accepting) |
| **$q_2$** (**Accepting**) | $q_2$ | $q_{\text{dead}}$ | $\ge 2$ spaces consumed (**Accepting**) |
| **$q_{\text{dead}}$** (Trap) | $q_{\text{dead}}$ | $q_{\text{dead}}$ | Dead state for whole-string recognition |

---

## 3. State Transition Diagram

```
      Start
        │
        ▼
     ┌─────┐      SPACE       ┌─────┐      SPACE       ╔═════╗  SPACE
     │ q0  ├─────────────────►│ q1  ├─────────────────►║ q2  ║──┐
     └──┬──┘                  └──┬──┘                  ╚══╤══╝  │
        │                        │                        │     │
        │ OTHER                  │ OTHER                  │ OTHER
        │                        ▼                        │     │
        │                     ┌─────┐                     │     ▼
        └────────────────────►│qdead│◄────────────────────┘   (Loop)
                              └──┬──┘
                                 │
                                 └── (SPACE, OTHER) Loop
```

---

## 4. Distinction Between Formal Recognizer and Document Scanner

### 4.1 Formal Whole-String Recognizer
- Consumes string $w$ character-by-character from left to right starting at $q_0$.
- Any non-space symbol transitions to $q_{\text{dead}}$, where it remains trapped.
- String $w$ is accepted if and only if $\delta^*(q_0, w) \in F = \{q_2\}$.
- **Examples:**
  - $w = \text{"  "}$ (2 spaces): $q_0 \xrightarrow{\text{SPACE}} q_1 \xrightarrow{\text{SPACE}} q_2 \implies$ **ACCEPTED**
  - $w = \text{"   "}$ (3 spaces): $q_0 \xrightarrow{\text{SPACE}} q_1 \xrightarrow{\text{SPACE}} q_2 \xrightarrow{\text{SPACE}} q_2 \implies$ **ACCEPTED**
  - $w = \text{" "}$ (1 space): $q_0 \xrightarrow{\text{SPACE}} q_1 \implies$ **REJECTED**
  - $w = \text{" a"}$: $q_0 \xrightarrow{\text{SPACE}} q_1 \xrightarrow{\text{OTHER}} q_{\text{dead}} \implies$ **REJECTED**

### 4.2 Document Stream Scanner
- When scanning an entire document, the engine must identify all local substring occurrences of two or more spaces without getting trapped indefinitely in $q_{\text{dead}}$.
- The scanner initializes at document index 0 in state $q_0$.
- Upon reading `SPACE`:
  - In $q_0$: transitions to $q_1$, recording `run_start = index`.
  - In $q_1$: transitions to $q_2$ (now accepting).
  - In $q_2$: remains in $q_2$ for additional spaces.
- Upon reading `OTHER` or reaching End-Of-File (EOF):
  - If state was $q_2$, it emits the maximal match span `[run_start..index]`.
  - State cleanly resets to $q_0$, and `run_start` resets to -1.
- This design guarantees mathematical equivalence with Python regex ` {2,}` while strictly adhering to pure finite state automata theory without regex libraries.

