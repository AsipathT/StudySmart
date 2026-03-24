import React from "react";

export function FlipWords({
  words = [],
  durationMs = 2000,
  className = "",
}) {
  const safeWords = Array.isArray(words) ? words.filter(Boolean) : [];
  const [index, setIndex] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (safeWords.length <= 1) return;

    const id = window.setInterval(() => {
      setIsAnimating(true);

      window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % safeWords.length);
        setIsAnimating(false);
      }, 250);
    }, durationMs);

    return () => window.clearInterval(id);
  }, [durationMs, safeWords.length]);

  const word = safeWords[index] ?? "";

  return (
    <span
      className={[
        "inline-block align-baseline",
        "px-1.5",
        "font-semibold",
        "text-indigo-700",
        "transition-all duration-300",
        isAnimating ? "opacity-0 -translate-y-1" : "opacity-100 translate-y-0",
        className,
      ].join(" ")}
      aria-live="polite"
    >
      {word}
    </span>
  );
}
