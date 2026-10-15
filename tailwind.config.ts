import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Evo brand palette — driven by CSS variables defined in globals.css.
        // Same Tailwind classes serve both dark (default) and light themes.
        // - `ink` is constant dark across themes: it's the text color on the
        //   cyan button. `canvas` is the page/sheet surface that flips.
        // - `onAccent` is the only foreground allowed on an `evo-lime` fill.
        evo: {
          lime: "rgb(var(--evo-lime) / <alpha-value>)",
          limeDark: "rgb(var(--evo-lime-dark) / <alpha-value>)",
          ink: "rgb(var(--evo-ink) / <alpha-value>)",
          onAccent: "rgb(var(--evo-on-accent) / <alpha-value>)",
          text: "rgb(var(--evo-text) / <alpha-value>)",
          canvas: "rgb(var(--evo-canvas) / <alpha-value>)",
          surface: "rgb(var(--evo-surface) / <alpha-value>)",
          surface2: "rgb(var(--evo-surface2) / <alpha-value>)",
          line: "rgb(var(--evo-line) / <alpha-value>)",
          mute: "rgb(var(--evo-mute) / <alpha-value>)",
          bg: "rgb(var(--evo-bg) / <alpha-value>)",
        },
        // §7 trust tiers. Hue is the tier's identity; lightness is tuned per
        // theme in globals.css so each badge clears 4.5:1 on its surface.
        trust: {
          unverified: "rgb(var(--trust-unverified) / <alpha-value>)",
          community: "rgb(var(--trust-community) / <alpha-value>)",
          verified: "rgb(var(--trust-verified) / <alpha-value>)",
          evo: "rgb(var(--trust-evo) / <alpha-value>)",
        },
        demo: {
          bubble: "rgb(var(--demo-bubble) / <alpha-value>)",
          fg: "rgb(var(--demo-bubble-fg) / <alpha-value>)",
        },
        tone: {
          ok: "rgb(var(--tone-ok) / <alpha-value>)",
          warn: "rgb(var(--tone-warn) / <alpha-value>)",
          danger: "rgb(var(--tone-danger) / <alpha-value>)",
        },
      },
      // Apple's iOS text styles at the default Dynamic Type size, as
      // [size, line-height]. Using these instead of ad-hoc `text-[10px]`
      // keeps vertical rhythm consistent and enforces the 11pt floor
      // (caption2 is the smallest style Apple ships).
      fontSize: {
        caption2: ["11px", { lineHeight: "13px" }],
        caption1: ["12px", { lineHeight: "16px" }],
        footnote: ["13px", { lineHeight: "18px" }],
        subhead: ["15px", { lineHeight: "20px" }],
        callout: ["16px", { lineHeight: "21px" }],
        body: ["17px", { lineHeight: "22px" }],
        headline: ["17px", { lineHeight: "22px", fontWeight: "600" }],
        title3: ["20px", { lineHeight: "25px" }],
        title2: ["22px", { lineHeight: "28px" }],
        title1: ["28px", { lineHeight: "34px" }],
      },
      spacing: {
        // HIG minimum hit target, and the standard 16pt layout margin.
        tap: "44px",
        gutter: "var(--gutter)",
        "safe-top": "var(--safe-top)",
        "safe-bottom": "var(--safe-bottom)",
        tabbar: "var(--tabbar-h)",
      },
      minHeight: { tap: "44px" },
      minWidth: { tap: "44px" },
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
        sheet: "0 -20px 50px -10px rgba(0,0,0,0.35)",
        card: "0 4px 16px -6px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
