import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Archivo", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        cyan: {50:'hsl(8 90% 96%)',100:'hsl(8 90% 92%)',200:'hsl(8 88% 62%)',300:'hsl(8 88% 56%)',400:'hsl(8 88% 52%)',500:'hsl(8 88% 50%)',600:'hsl(8 85% 45%)',700:'hsl(8 80% 38%)',800:'hsl(8 70% 28%)',900:'hsl(8 50% 18%)',950:'hsl(30 8% 8%)'}, sky: {50:'hsl(8 90% 96%)',100:'hsl(8 90% 92%)',200:'hsl(8 88% 62%)',300:'hsl(8 88% 56%)',400:'hsl(8 88% 52%)',500:'hsl(8 88% 50%)',600:'hsl(8 85% 45%)',700:'hsl(8 80% 38%)',800:'hsl(8 70% 28%)',900:'hsl(8 50% 18%)',950:'hsl(30 8% 8%)'}, teal: {50:'hsl(8 90% 96%)',100:'hsl(8 90% 92%)',200:'hsl(8 88% 62%)',300:'hsl(8 88% 56%)',400:'hsl(8 88% 52%)',500:'hsl(8 88% 50%)',600:'hsl(8 85% 45%)',700:'hsl(8 80% 38%)',800:'hsl(8 70% 28%)',900:'hsl(8 50% 18%)',950:'hsl(30 8% 8%)'}, blue: {50:'hsl(8 90% 96%)',100:'hsl(8 90% 92%)',200:'hsl(8 88% 62%)',300:'hsl(8 88% 56%)',400:'hsl(8 88% 52%)',500:'hsl(8 88% 50%)',600:'hsl(8 85% 45%)',700:'hsl(8 80% 38%)',800:'hsl(8 70% 28%)',900:'hsl(8 50% 18%)',950:'hsl(30 8% 8%)'}, fuchsia: {50:'hsl(40 20% 95%)',100:'hsl(40 18% 90%)',200:'hsl(40 14% 80%)',300:'hsl(35 8% 62%)',400:'hsl(30 6% 45%)',500:'hsl(30 6% 35%)',600:'hsl(30 7% 26%)',700:'hsl(30 8% 18%)',800:'hsl(30 8% 12%)',900:'hsl(30 8% 9%)',950:'hsl(30 8% 6%)'}, purple: {50:'hsl(40 20% 95%)',100:'hsl(40 18% 90%)',200:'hsl(40 14% 80%)',300:'hsl(35 8% 62%)',400:'hsl(30 6% 45%)',500:'hsl(30 6% 35%)',600:'hsl(30 7% 26%)',700:'hsl(30 8% 18%)',800:'hsl(30 8% 12%)',900:'hsl(30 8% 9%)',950:'hsl(30 8% 6%)'}, violet: {50:'hsl(40 20% 95%)',100:'hsl(40 18% 90%)',200:'hsl(40 14% 80%)',300:'hsl(35 8% 62%)',400:'hsl(30 6% 45%)',500:'hsl(30 6% 35%)',600:'hsl(30 7% 26%)',700:'hsl(30 8% 18%)',800:'hsl(30 8% 12%)',900:'hsl(30 8% 9%)',950:'hsl(30 8% 6%)'}, pink: {50:'hsl(8 90% 96%)',100:'hsl(8 90% 92%)',200:'hsl(8 88% 62%)',300:'hsl(8 88% 56%)',400:'hsl(8 88% 52%)',500:'hsl(8 88% 50%)',600:'hsl(8 85% 45%)',700:'hsl(8 80% 38%)',800:'hsl(8 70% 28%)',900:'hsl(8 50% 18%)',950:'hsl(30 8% 8%)'}, indigo: {50:'hsl(40 20% 95%)',100:'hsl(40 18% 90%)',200:'hsl(40 14% 80%)',300:'hsl(35 8% 62%)',400:'hsl(30 6% 45%)',500:'hsl(30 6% 35%)',600:'hsl(30 7% 26%)',700:'hsl(30 8% 18%)',800:'hsl(30 8% 12%)',900:'hsl(30 8% 9%)',950:'hsl(30 8% 6%)'},
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        stone: "hsl(var(--stone))",
        "surface-raised": "hsl(var(--surface-raised))",
        neon: {
          purple: "hsl(var(--neon-purple))",
          cyan: "hsl(var(--neon-cyan))",
          pink: "hsl(var(--neon-pink))",
        },
        chart: {
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        shimmer: {
          "0%": { transform: "translateX(0) skewX(12deg)" },
          "100%": { transform: "translateX(400%) skewX(12deg)" },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "slide-in-from-right": {
          "0%": { transform: "translateX(40px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-from-left": {
          "0%": { transform: "translateX(-40px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "tab-underline": {
          "0%":   { transform: "scaleX(0)", opacity: "0", transformOrigin: "left center" },
          "60%":  { transform: "scaleX(1.05)", opacity: "1" },
          "100%": { transform: "scaleX(1)", opacity: "1" },
        },
        "tab-fade-in": {
          "0%":   { opacity: "0", transform: "translateY(8px) scale(0.985)", filter: "blur(4px)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)", filter: "blur(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-in-from-left": "slide-in-from-left 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        "tab-underline": "tab-underline 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
        "tab-fade-in": "tab-fade-in 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
