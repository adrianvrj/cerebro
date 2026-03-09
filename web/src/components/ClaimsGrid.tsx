"use client";

import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import ScrambleText from "./ScrambleText";

type Claim = {
  label: string;
  value: string;
};

function ClaimBox({ claim, index }: { claim: Claim; index: number }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(claim.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const truncated =
    claim.value.length > 24
      ? claim.value.slice(0, 12) + "…" + claim.value.slice(-12)
      : claim.value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.08 }}
      className="border border-white/20 p-3 bg-black hover:bg-white hover:text-black transition-colors duration-100 group"
    >
      <div className="text-[10px] tracking-[0.2em] text-white/40 group-hover:text-black/40 mb-1">
        {claim.label}
      </div>
      <div className="font-mono text-xs flex items-center justify-between gap-2">
        <ScrambleText text={truncated} className="cursor-default" />
        <button
          onClick={copy}
          className="shrink-0 opacity-40 hover:opacity-100 transition-opacity"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
    </motion.div>
  );
}

export default function ClaimsGrid({ claims }: { claims: Claim[] }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.3em] text-white/30 uppercase mb-3">
        VERIFIED_CLAIMS
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[1px]">
        {claims.map((claim, i) => (
          <ClaimBox key={claim.label} claim={claim} index={i} />
        ))}
      </div>
    </div>
  );
}
