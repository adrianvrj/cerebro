"use client";

import { useState, useCallback, useRef } from "react";

const CHARS = "0123456789abcdef";

export default function ScrambleText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(text);
  const frameRef = useRef<number | null>(null);

  const scramble = useCallback(() => {
    if (frameRef.current) return;

    let iterations = 0;
    const maxIterations = 8;

    const run = () => {
      iterations++;
      if (iterations >= maxIterations) {
        setDisplay(text);
        frameRef.current = null;
        return;
      }

      setDisplay(
        text
          .split("")
          .map((char, i) => {
            if (char === " " || char === "…") return char;
            if (i < (iterations / maxIterations) * text.length) return text[i];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );

      frameRef.current = requestAnimationFrame(run);
    };

    frameRef.current = requestAnimationFrame(run);
  }, [text]);

  const reset = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    setDisplay(text);
  }, [text]);

  return (
    <span
      className={className}
      onMouseEnter={scramble}
      onMouseLeave={reset}
    >
      {display}
    </span>
  );
}
