"use client";

import { motion } from "framer-motion";

export default function JwtPreview({ jwt }: { jwt: string }) {
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;

  let header: object | null = null;
  let payload: object | null = null;

  try {
    header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
    payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.15 }}
      className="border border-white/10 bg-black"
    >
      <div className="text-[10px] tracking-[0.3em] text-white/30 uppercase p-3 pb-0">
        DECODED_PREVIEW
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-white/10">
        <div className="p-3">
          <div className="text-[9px] tracking-[0.2em] text-white/20 mb-1">HEADER</div>
          <pre className="font-mono text-[11px] text-white/50 overflow-x-auto">
            {JSON.stringify(header, null, 2)}
          </pre>
        </div>
        <div className="p-3">
          <div className="text-[9px] tracking-[0.2em] text-white/20 mb-1">PAYLOAD</div>
          <pre className="font-mono text-[11px] text-white/50 overflow-x-auto">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      </div>
    </motion.div>
  );
}
