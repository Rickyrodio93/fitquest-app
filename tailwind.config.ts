import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#12151B", // sfondo principale
          panel: "#1B1F28",   // superfici/card
          line: "#2A2F3A",    // hairline, griglia
        },
        paper: {
          DEFAULT: "#ECEFF3", // testo primario
          muted: "#8A93A3",   // testo secondario
        },
        growth: {
          DEFAULT: "#4FD1A5", // crescita muscolare / progresso positivo
          dim: "#2F7A5D",
        },
        effort: {
          DEFAULT: "#E3A857", // costanza, streak, energia
          dim: "#8A6530",
        },
        caution: {
          DEFAULT: "#E2725B", // massa grassa in aumento, avvisi
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
    },
  },
  plugins: [],
};

export default config;
