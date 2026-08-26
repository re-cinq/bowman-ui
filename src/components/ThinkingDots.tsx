"use client";

// The three fading dots shared by ThinkingIndicator and
// InlineThinkingIndicator, extracted so the animation timing cannot drift
// between them (024). Deliberately not exported from the barrel: the dots are
// an internal detail of the two indicators, not public API.
export function ThinkingDots() {
  return (
    <span className="flex gap-0.5">
      <span
        className="bowman-fade-dot h-1 w-1 rounded-full bg-blue-500"
        style={{ animationDelay: "0s" }}
      />
      <span
        className="bowman-fade-dot h-1 w-1 rounded-full bg-blue-500"
        style={{ animationDelay: "0.2s" }}
      />
      <span
        className="bowman-fade-dot h-1 w-1 rounded-full bg-blue-500"
        style={{ animationDelay: "0.4s" }}
      />
    </span>
  );
}
