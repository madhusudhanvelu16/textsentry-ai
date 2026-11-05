"use client";

import React from "react";

interface DFADiagramSVGProps {
  activeState: string;
  lastSymbol?: string;
  isAccepting?: boolean;
}

export function DFADiagramSVG({
  activeState,
  lastSymbol,
  isAccepting,
}: DFADiagramSVGProps) {
  // Node coordinates in SVG coordinate system
  const nodes = {
    q0: { x: 130, y: 130, label: "q0", sublabel: "Start (0 spaces)", isStart: true, isAccept: false },
    q1: { x: 370, y: 130, label: "q1", sublabel: "1 space consumed", isStart: false, isAccept: false },
    q2: { x: 610, y: 130, label: "q2", sublabel: "≥ 2 spaces (ACCEPT)", isStart: false, isAccept: true },
    qdead: { x: 370, y: 290, label: "qdead", sublabel: "Trap / Dead state", isStart: false, isAccept: false },
  };

  const isNodeActive = (stateId: string) => activeState === stateId;

  return (
    <div className="w-full overflow-x-auto flex justify-center py-4 bg-canvas/80 rounded-3xl border border-border-subtle shadow-inner">
      <svg
        viewBox="0 0 760 380"
        className="w-full max-w-3xl h-auto select-none font-sans"
        style={{ minWidth: "620px" }}
      >
        <defs>
          {/* Arrowhead marker */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
          </marker>

          {/* Active arrow marker */}
          <marker
            id="arrow-active"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
          </marker>

          {/* Dead state arrow marker */}
          <marker
            id="arrow-dead"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
          </marker>

          {/* Radial glow filter for active state */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --- START ARROW (into q0) --- */}
        <g>
          <path
            d="M 40 130 L 86 130"
            stroke="#3b82f6"
            strokeWidth="2.5"
            markerEnd="url(#arrow)"
          />
          <text x="45" y="118" fill="#3b82f6" fontSize="12" fontWeight="bold">
            Start
          </text>
        </g>

        {/* --- TRANSITION 1: q0 -> q1 (SPACE) --- */}
        <g>
          <path
            d="M 174 130 L 326 130"
            stroke={isNodeActive("q1") && lastSymbol === "SPACE" ? "#10b981" : "#3b82f6"}
            strokeWidth={isNodeActive("q1") && lastSymbol === "SPACE" ? "3.5" : "2"}
            markerEnd={isNodeActive("q1") && lastSymbol === "SPACE" ? "url(#arrow-active)" : "url(#arrow)"}
          />
          <rect x="228" y="110" width="64" height="20" rx="6" fill="var(--bg-panel)" stroke="var(--border-muted)" />
          <text x="260" y="124" fill="#3b82f6" fontSize="11" fontWeight="bold" textAnchor="middle">
            SPACE
          </text>
        </g>

        {/* --- TRANSITION 2: q1 -> q2 (SPACE) --- */}
        <g>
          <path
            d="M 414 130 L 564 130"
            stroke={isNodeActive("q2") && lastSymbol === "SPACE" ? "#10b981" : "#3b82f6"}
            strokeWidth={isNodeActive("q2") && lastSymbol === "SPACE" ? "3.5" : "2"}
            markerEnd={isNodeActive("q2") && lastSymbol === "SPACE" ? "url(#arrow-active)" : "url(#arrow)"}
          />
          <rect x="468" y="110" width="64" height="20" rx="6" fill="var(--bg-panel)" stroke="var(--border-muted)" />
          <text x="500" y="124" fill="#3b82f6" fontSize="11" fontWeight="bold" textAnchor="middle">
            SPACE
          </text>
        </g>

        {/* --- TRANSITION 3: q2 -> q2 (SPACE Self Loop) --- */}
        <g>
          <path
            d="M 595 88 C 580 38, 640 38, 625 88"
            fill="none"
            stroke={isNodeActive("q2") && lastSymbol === "SPACE" ? "#10b981" : "#3b82f6"}
            strokeWidth={isNodeActive("q2") && lastSymbol === "SPACE" ? "3.5" : "2"}
            markerEnd={isNodeActive("q2") && lastSymbol === "SPACE" ? "url(#arrow-active)" : "url(#arrow)"}
          />
          <rect x="578" y="24" width="64" height="20" rx="6" fill="var(--bg-panel)" stroke="var(--border-muted)" />
          <text x="610" y="38" fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle">
            SPACE
          </text>
        </g>

        {/* --- TRANSITIONS TO qdead (OTHER) --- */}
        {/* q0 -> qdead */}
        <g>
          <path
            d="M 152 168 C 190 250, 270 290, 326 290"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="1.8"
            strokeDasharray="4 3"
            markerEnd="url(#arrow-dead)"
          />
          <text x="210" y="240" fill="#f43f5e" fontSize="11" fontWeight="bold">
            OTHER
          </text>
        </g>

        {/* q1 -> qdead */}
        <g>
          <path
            d="M 370 174 L 370 248"
            stroke="#f43f5e"
            strokeWidth="1.8"
            strokeDasharray="4 3"
            markerEnd="url(#arrow-dead)"
          />
          <rect x="382" y="200" width="56" height="18" rx="4" fill="var(--bg-panel)" stroke="var(--border-muted)" />
          <text x="410" y="213" fill="#f43f5e" fontSize="11" fontWeight="bold" textAnchor="middle">
            OTHER
          </text>
        </g>

        {/* q2 -> qdead */}
        <g>
          <path
            d="M 588 168 C 550 250, 470 290, 414 290"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="1.8"
            strokeDasharray="4 3"
            markerEnd="url(#arrow-dead)"
          />
          <text x="500" y="240" fill="#f43f5e" fontSize="11" fontWeight="bold">
            OTHER
          </text>
        </g>

        {/* qdead -> qdead (Self Loop on SPACE, OTHER) */}
        <g>
          <path
            d="M 350 330 C 335 375, 405 375, 390 330"
            fill="none"
            stroke="#f43f5e"
            strokeWidth="1.8"
            markerEnd="url(#arrow-dead)"
          />
          <rect x="325" y="355" width="90" height="20" rx="6" fill="var(--bg-panel)" stroke="var(--border-muted)" />
          <text x="370" y="369" fill="#f43f5e" fontSize="10" fontWeight="bold" textAnchor="middle">
            SPACE, OTHER
          </text>
        </g>

        {/* --- STATE NODES --- */}

        {/* q0 NODE */}
        <g className="cursor-pointer">
          {isNodeActive("q0") && (
            <circle cx={nodes.q0.x} cy={nodes.q0.y} r="48" fill="#3b82f6" fillOpacity="0.25" filter="url(#glow)" className="dfa-active-pulse" />
          )}
          <circle
            cx={nodes.q0.x}
            cy={nodes.q0.y}
            r="40"
            fill="var(--bg-panel)"
            stroke={isNodeActive("q0") ? "#3b82f6" : "var(--border-muted)"}
            strokeWidth={isNodeActive("q0") ? "4" : "2"}
          />
          <text x={nodes.q0.x} y={nodes.q0.y + 6} fill="var(--text-primary)" fontSize="16" fontWeight="bold" textAnchor="middle">
            q0
          </text>
          <text x={nodes.q0.x} y={nodes.q0.y + 60} fill="var(--text-muted)" fontSize="11" fontWeight="600" textAnchor="middle">
            Start
          </text>
        </g>

        {/* q1 NODE */}
        <g className="cursor-pointer">
          {isNodeActive("q1") && (
            <circle cx={nodes.q1.x} cy={nodes.q1.y} r="48" fill="#f59e0b" fillOpacity="0.25" filter="url(#glow)" className="dfa-active-pulse" />
          )}
          <circle
            cx={nodes.q1.x}
            cy={nodes.q1.y}
            r="40"
            fill="var(--bg-panel)"
            stroke={isNodeActive("q1") ? "#f59e0b" : "var(--border-muted)"}
            strokeWidth={isNodeActive("q1") ? "4" : "2"}
          />
          <text x={nodes.q1.x} y={nodes.q1.y + 6} fill="var(--text-primary)" fontSize="16" fontWeight="bold" textAnchor="middle">
            q1
          </text>
          <text x={nodes.q1.x} y={nodes.q1.y + 60} fill="var(--text-muted)" fontSize="11" fontWeight="600" textAnchor="middle">
            1 Space
          </text>
        </g>

        {/* q2 NODE (DOUBLE CIRCLE ACCEPTING STATE) */}
        <g className="cursor-pointer">
          {isNodeActive("q2") && (
            <circle cx={nodes.q2.x} cy={nodes.q2.y} r="54" fill="#10b981" fillOpacity="0.3" filter="url(#glow)" className="dfa-accept-pulse" />
          )}
          {/* Outer accepting ring */}
          <circle
            cx={nodes.q2.x}
            cy={nodes.q2.y}
            r="44"
            fill="var(--bg-panel)"
            stroke={isNodeActive("q2") ? "#10b981" : "#10b981"}
            strokeWidth={isNodeActive("q2") ? "4" : "2.5"}
          />
          {/* Inner ring */}
          <circle
            cx={nodes.q2.x}
            cy={nodes.q2.y}
            r="36"
            fill="none"
            stroke={isNodeActive("q2") ? "#10b981" : "#10b981"}
            strokeWidth="1.8"
          />
          <text x={nodes.q2.x} y={nodes.q2.y + 6} fill="var(--text-primary)" fontSize="16" fontWeight="bold" textAnchor="middle">
            q2
          </text>
          <text x={nodes.q2.x} y={nodes.q2.y + 64} fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle">
            Accept (F)
          </text>
        </g>

        {/* qdead TRAP NODE */}
        <g className="cursor-pointer">
          {isNodeActive("qdead") && (
            <circle cx={nodes.qdead.x} cy={nodes.qdead.y} r="48" fill="#f43f5e" fillOpacity="0.25" filter="url(#glow)" />
          )}
          <circle
            cx={nodes.qdead.x}
            cy={nodes.qdead.y}
            r="38"
            fill="var(--bg-panel)"
            stroke={isNodeActive("qdead") ? "#f43f5e" : "#e11d48"}
            strokeWidth={isNodeActive("qdead") ? "4" : "2"}
          />
          <text x={nodes.qdead.x} y={nodes.qdead.y + 5} fill="#f43f5e" fontSize="14" fontWeight="bold" textAnchor="middle">
            qdead
          </text>
          <text x={nodes.qdead.x} y={nodes.qdead.y + 55} fill="#f43f5e" fontSize="10" fontWeight="bold" textAnchor="middle">
            Trap State
          </text>
        </g>
      </svg>
    </div>
  );
}
