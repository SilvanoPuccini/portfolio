import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["selector", "[data-theme='dark']"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: withOpacity("--background"),
        foreground: withOpacity("--foreground"),
        surface: {
          dim: withOpacity("--surface-dim"),
          DEFAULT: withOpacity("--surface"),
          elevated: withOpacity("--surface-elevated"),
          glass: withOpacity("--surface-glass"),
          contrast: withOpacity("--surface-contrast"),
        },
        text: {
          primary: withOpacity("--text-primary"),
          secondary: withOpacity("--text-secondary"),
          tertiary: withOpacity("--text-tertiary"),
        },
        brand: {
          primary: withOpacity("--brand-primary"),
          secondary: withOpacity("--brand-secondary"),
          glow: withOpacity("--brand-glow"),
        },
        outline: {
          ghost: withOpacity("--outline-ghost"),
          strong: withOpacity("--outline-strong"),
        },
        accent: {
          warm: withOpacity("--accent-warm"),
        },
      },
      boxShadow: {
        ambient: "0 20px 40px rgba(8, 14, 29, 0.38)",
        glass: "0 24px 80px rgba(3, 8, 22, 0.42)",
        glow: "0 10px 30px rgba(34, 211, 238, 0.12)",
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top left, rgba(138, 235, 255, 0.16), transparent 34%), radial-gradient(circle at 80% 10%, rgba(5, 102, 217, 0.24), transparent 30%), linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(5, 102, 217, 0.18))",
        texture:
          "radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.12) 1px, transparent 0)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        sm: "0.5rem",
        md: "0.875rem",
        lg: "1.25rem",
        xl: "1.5rem",
        pill: "999px",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
        34: "8.5rem",
      },
      letterSpacing: {
        editorial: "-0.02em",
      },
    },
  },
  plugins: [typography],
};

export default config;
