export const LANTERNS = {
  gold: { label: "Candle gold", glow: "#ffc45e", text: "#fff4cf", name: "#ffd98a" },
  rose: { label: "Rose", glow: "#ff7fa8", text: "#ffe6ee", name: "#ffb3c9" },
  jade: { label: "Jade", glow: "#5fe0a8", text: "#e3fff1", name: "#9ff0c8" },
  sky: { label: "Moonlit blue", glow: "#6fb8ff", text: "#e6f3ff", name: "#a8d4ff" },
  violet: { label: "Violet", glow: "#b48cff", text: "#f1e8ff", name: "#d2b8ff" },
  ember: { label: "Ember", glow: "#ff8a4a", text: "#fff0e4", name: "#ffbd8f" },
} as const;

export type LanternColor = keyof typeof LANTERNS;
export const lanternOf = (c?: string) => LANTERNS[(c as LanternColor) in LANTERNS ? (c as LanternColor) : "gold"];
