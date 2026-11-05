"""FastAPI Application Main Entry Point for TextSentry AI."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.endpoints import router as api_router

app = FastAPI(
    title="TextSentry AI — Regex & DFA Text Correction Lab",
    description=(
        "Production backend for Theory of Computation Academic Case Study: "
        "'Text Error Identification and Correction Using Regular Expressions "
        "and Deterministic Finite Automata'.\n\n"
        "Provides 6 regex-based grammatical/formatting error detectors, "
        "a pure DFA (Q={q0,q1,q2,qdead}) scanner and simulator without regex libraries, "
        "conflict-free correction pipelines, and nanosecond-resolution benchmarks."
    ),
    version="1.0.0",
)

# Enable CORS for Next.js frontend (Vercel & Localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

