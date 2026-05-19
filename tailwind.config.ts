import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Evo brand palette — driven by CSS variables defined in globals.css.
        // Same Tailwind classes serve both dark (default) and light themes.
        // - `ink` is constant dark across themes: it's the text color on the
        //   blue button. `canvas` is the page/sheet surface that flips.
        evo: {
          lime: "rgb(var(--evo-lime) / <alpha-value>)",
          limeDark: "rgb(var(--evo-lime-dark) / <alpha-value>)",
          ink: "rgb(var(--evo-ink) / <alpha-value>)",
          text: "rgb(var(--evo-text) / <alpha-value>)",
          canvas: "rgb(var(--evo-canvas) / <alpha-value>)",
          surface: "rgb(var(--evo-surface) / <alpha-value>)",
          surface2: "rgb(var(--evo-surface2) / <alpha-value>)",
          line: "rgb(var(--evo-line) / <alpha-value>)",
          mute: "rgb(var(--evo-mute) / <alpha-value>)",
          bg: "rgb(var(--evo-bg) / <alpha-value>)",
        },
        trust: {
          unverified: "#E4A642", // amber
          community: "#3F8DF7",  // blue
          verified: "#2DB39A",   // teal
          evo: "#5BB85C",        // green
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        sheet: "0 -20px 50px -10px rgba(0,0,0,0.7)",
        card: "0 4px 16px -6px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
