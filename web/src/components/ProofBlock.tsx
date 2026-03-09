"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function ProofBlock({ proof }: { proof: object }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(proof, null, 2);

  const copy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border border-white/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white hover:text-black transition-colors duration-100 group"
      >
        <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-white/30 group-hover:text-black/50">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          ZK_PROOF_DATA
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            copy();
          }}
          className="text-[10px] tracking-[0.15em] text-white/30 hover:text-white group-hover:text-black/50 group-hover:hover:text-black"
        >
          {copied ? "[DONE]" : "[COPY]"}
        </button>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <pre className="p-3 font-mono text-[11px] text-white/60 overflow-x-auto max-h-80 overflow-y-auto border-t border-white/10">
              {json}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
