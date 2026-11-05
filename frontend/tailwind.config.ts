import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg-canvas)",
        panel: {
          DEFAULT: "var(--bg-panel)",
          subtle: "var(--bg-panel-subtle)",
          muted: "var(--bg-panel-muted)",
        },
        border: {
          subtle: "var(--border-subtle)",
          muted: "var(--border-muted)",
          glow: "var(--border-glow)",
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        electric: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        violetAccent: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      boxShadow: {
        subtle: "var(--shadow-subtle)",
        card: "var(--shadow-card)",
        glow: "0 0 25px -5px rgba(59, 130, 246, 0.3)",
        "glow-violet": "0 0 25px -5px rgba(139, 92, 246, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
