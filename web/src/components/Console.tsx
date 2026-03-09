"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type LogEntry = {
  id: string;
  prefix: "[+]" | "[!]" | "[*]" | "[x]";
  message: string;
};

export default function Console({ logs }: { logs: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const prefixColor = (prefix: string) => {
    switch (prefix) {
      case "[+]": return "text-white";
      case "[!]": return "text-white/70";
      case "[*]": return "text-white/50";
      case "[x]": return "text-white/40";
      default: return "text-white";
    }
  };

  return (
    <div className="border border-white/20 bg-black font-mono text-xs h-48 overflow-y-auto p-3">
      <div className="text-white/30 mb-2 text-[10px] tracking-[0.3em] uppercase">
        SYSTEM_LOG
      </div>
      <AnimatePresence>
        {logs.map((log) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="leading-relaxed"
          >
            <span className={prefixColor(log.prefix)}>{log.prefix}</span>{" "}
            <span className="text-white/80">{log.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      {logs.length === 0 && (
        <div className="text-white/20 cursor-blink">AWAITING_INPUT</div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
