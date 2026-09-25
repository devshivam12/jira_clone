// The closed set of epic colors, kept in sync with EPIC_COLOR_SWATCHES in
// backend2/graphql/resolver/task.resolver.js.
export const EPIC_COLOR_SWATCHES = [
  "bg-purple-500", "bg-blue-500", "bg-teal-500", "bg-orange-500",
  "bg-pink-500", "bg-indigo-500", "bg-emerald-500", "bg-rose-500",
];

// Tailwind only ships classes it can see in the source, so every variant a
// bar might use has to be written out here rather than built from the color
// name at runtime.
const THEMES = {
  "bg-purple-500": { bar: "bg-purple-500", barSoft: "bg-purple-200", tint: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", ring: "ring-purple-300" },
  "bg-blue-500": { bar: "bg-blue-500", barSoft: "bg-blue-200", tint: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", ring: "ring-blue-300" },
  "bg-teal-500": { bar: "bg-teal-500", barSoft: "bg-teal-200", tint: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", ring: "ring-teal-300" },
  "bg-orange-500": { bar: "bg-orange-500", barSoft: "bg-orange-200", tint: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", ring: "ring-orange-300" },
  "bg-pink-500": { bar: "bg-pink-500", barSoft: "bg-pink-200", tint: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", ring: "ring-pink-300" },
  "bg-indigo-500": { bar: "bg-indigo-500", barSoft: "bg-indigo-200", tint: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", ring: "ring-indigo-300" },
  "bg-emerald-500": { bar: "bg-emerald-500", barSoft: "bg-emerald-200", tint: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", ring: "ring-emerald-300" },
  "bg-rose-500": { bar: "bg-rose-500", barSoft: "bg-rose-200", tint: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", ring: "ring-rose-300" },
};

const FALLBACK = THEMES["bg-purple-500"];

export function getEpicTheme(color) {
  return THEMES[color] || FALLBACK;
}

// Workflow status colours come from the project template, where they are saved
// either as a Tailwind class ("bg-blue-500") or as a hex value ("#2563eb").
// A hex string used as a class name paints nothing, so it has to go through
// the style attribute instead. Returns props to spread onto the dot/pill:
// `{ className }` for a class, `{ style }` for a hex.
export function getStatusColorProps(color) {
  if (!color) return { className: "bg-neutral-300" };
  if (typeof color === "string" && color.startsWith("#")) {
    return { style: { backgroundColor: color } };
  }
  return { className: color };
}
