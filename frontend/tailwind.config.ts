import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "var(--color-background)",
          50: "var(--color-paper-50)",
          100: "var(--color-paper-100)"
        },
        ink: "var(--color-foreground)",
        muted: "var(--color-muted)",
        surface: "var(--color-surface)",
        line: "var(--color-border)",
        accent: "var(--color-accent)",
        clay: "var(--color-clay)",
        moss: "var(--color-moss)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)"
      },
      fontFamily: {
        body: "var(--font-body)",
        accent: "var(--font-accent)"
      },
      boxShadow: {
        rule: "inset 0 -1px 0 var(--color-border)"
      }
    }
  },
  plugins: []
};

export default config;

