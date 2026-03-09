"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import Console, { LogEntry } from "@/components/Console";
import ClaimsGrid from "@/components/ClaimsGrid";
import ProofBlock from "@/components/ProofBlock";
import JwtPreview from "@/components/JwtPreview";

const API_URL =
  process.env.NEXT_PUBLIC_CEREBRO_API_URL || "https://api.cerebro.cavos.xyz";

type ProveResult = {
  proof: object;
  publicSignals: string[];
  claims: {
    pubkey_hash: string;
    sub_hash: string;
    nonce_hash: string;
    iss_hash: string;
    aud_hash: string;
    exp: string;
  };
  prover: string;
  provingTimeSeconds: number;
};

let logId = 0;
const mkLog = (prefix: LogEntry["prefix"], message: string): LogEntry => ({
  id: String(++logId),
  prefix,
  message,
});

export default function ProvePage() {
  const [jwt, setJwt] = useState("");
  const [modulus, setModulus] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<ProveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addLog = useCallback(
    (prefix: LogEntry["prefix"], message: string) => {
      setLogs((prev) => [...prev, mkLog(prefix, message)]);
    },
    []
  );

  const handleProve = async () => {
    if (!jwt.trim() || !modulus.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);
    setLogs([]);

    addLog("[+]", "INITIALIZING_PROVER");

    const parts = jwt.trim().split(".");
    if (parts.length !== 3) {
      addLog("[x]", "ERROR: INVALID_JWT_STRUCTURE (expected 3 parts)");
      setError("Invalid JWT structure");
      setLoading(false);
      return;
    }

    addLog("[+]", "JWT_STRUCTURE_VALIDATED");
    addLog("[!]", "SENDING_TO_PROVER_BACKEND");
    addLog("[*]", "GENERATING_GROTH16_PROOF...");

    try {
      const res = await fetch(`${API_URL}/prove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jwt: jwt.trim(), modulus: modulus.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        addLog("[x]", `ERROR: ${data.error}`);
        setError(data.error || "Prover error");
        setLoading(false);
        return;
      }

      addLog(
        "[+]",
        `PROOF_GENERATED (${data.provingTimeSeconds}s via ${data.prover})`
      );
      addLog("[+]", `PUBKEY_HASH: ${data.claims.pubkey_hash}`);
      addLog("[+]", `SUB_HASH: ${data.claims.sub_hash}`);
      addLog("[+]", `EXP: ${data.claims.exp}`);
      addLog("[+]", "VERIFICATION_COMPLETE");

      setResult(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      addLog("[x]", `NETWORK_ERROR: ${msg}`);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
      <div className="space-y-1 mb-8">
        <h1 className="text-2xl font-bold tracking-[0.2em]">GENERATE_PROOF</h1>
        <p className="text-xs text-white/30 font-mono tracking-[0.15em]">
          Submit a JWT and RSA modulus to generate a Groth16 zero-knowledge
          proof
        </p>
      </div>

      {/* Input Zone */}
      <section className="space-y-4">
        <div>
          <label className="block text-[10px] tracking-[0.3em] text-white/30 uppercase mb-2">
            ENCODED_JWT
          </label>
          <textarea
            autoFocus
            value={jwt}
            onChange={(e) => setJwt(e.target.value)}
            placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="w-full h-32 bg-black border border-white/20 p-3 font-mono text-sm text-white/80 placeholder:text-white/15 resize-none focus:border-white transition-colors duration-100"
            spellCheck={false}
          />
        </div>

        <AnimatePresence>
          {jwt.split(".").length === 3 && jwt.length > 20 && (
            <JwtPreview jwt={jwt} />
          )}
        </AnimatePresence>

        <div>
          <label className="block text-[10px] tracking-[0.3em] text-white/30 uppercase mb-2">
            RSA_MODULUS
          </label>
          <input
            value={modulus}
            onChange={(e) => setModulus(e.target.value)}
            placeholder="Decimal or hex RSA public key modulus"
            className="w-full bg-black border border-white/20 p-3 font-mono text-sm text-white/80 placeholder:text-white/15 focus:border-white transition-colors duration-100"
            spellCheck={false}
          />
        </div>

        <button
          onClick={handleProve}
          disabled={loading || !jwt.trim() || !modulus.trim()}
          className="w-full border border-white p-3 text-sm tracking-[0.3em] font-bold uppercase transition-colors duration-100 hover:bg-white hover:text-black disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-white flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              PROVING...
            </>
          ) : (
            "GENERATE_PROOF"
          )}
        </button>
      </section>

      {/* Console */}
      <Console logs={logs} />

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border border-white/20 p-3 text-xs font-mono text-white/60"
          >
            [ERROR] {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Output Zone */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="flex gap-6 text-[10px] tracking-[0.2em] font-mono text-white/30">
              <span>PROVER: {result.prover.toUpperCase()}</span>
              <span>TIME: {result.provingTimeSeconds}s</span>
              <span>SIGNALS: {result.publicSignals.length}</span>
            </div>

            <ClaimsGrid
              claims={[
                { label: "PUBKEY_HASH", value: result.claims.pubkey_hash },
                { label: "SUB_HASH", value: result.claims.sub_hash },
                { label: "NONCE_HASH", value: result.claims.nonce_hash },
                { label: "ISS_HASH", value: result.claims.iss_hash },
                { label: "AUD_HASH", value: result.claims.aud_hash },
                { label: "EXP", value: result.claims.exp },
              ]}
            />

            <ProofBlock proof={result.proof} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
