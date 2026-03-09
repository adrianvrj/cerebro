"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-white/30 hover:text-white transition-colors"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function CodeBlock({ code, lang = "" }: { code: string; lang?: string }) {
  return (
    <div className="border border-white/15 bg-white/[0.02] relative group">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-[10px] tracking-[0.2em] text-white/30 font-mono uppercase">
          {lang}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 font-mono text-[12px] text-white/70 overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="scroll-mt-24"
    >
      <h2 className="text-xl font-bold tracking-[0.15em] mb-6 border-b border-white/15 pb-3 text-white">
        {title}
      </h2>
      <div className="space-y-6 text-[15px] text-white/70 leading-[1.8]">
        {children}
      </div>
    </motion.section>
  );
}

const NAV_ITEMS = [
  { id: "overview", label: "OVERVIEW" },
  { id: "api", label: "API" },
  { id: "request", label: "REQUEST" },
  { id: "response", label: "RESPONSE" },
  { id: "errors", label: "ERRORS" },
  { id: "circuit", label: "CIRCUIT" },
  { id: "contracts", label: "CONTRACTS" },
  { id: "integration", label: "INTEGRATION" },
];

export default function DocsPage() {
  return (
    <div className="max-w-6xl mx-auto flex">
      {/* Sidebar nav */}
      <nav className="hidden lg:block w-52 shrink-0 border-r border-white/10 py-10 px-6 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
        <div className="text-[10px] tracking-[0.3em] text-white/30 uppercase mb-6">
          DOCUMENTATION
        </div>
        <div className="space-y-2">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="block text-[12px] tracking-[0.15em] text-white/40 hover:text-white py-1.5 transition-colors font-mono"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 py-10 px-8 lg:px-14 space-y-16 min-w-0">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-[0.15em] text-white">
            DOCUMENTATION
          </h1>
          <p className="text-sm text-white/40 font-mono tracking-[0.1em]">
            API reference and integration guide for the Cerebro ZK prover
          </p>
        </div>

        <Section id="overview" title="OVERVIEW">
          <p>
            Cerebro is a zero-knowledge proving service for JWT verification. It
            accepts a standard JWT and its RSA public key modulus, then generates
            a Groth16 proof that the token is valid — without revealing the
            token&apos;s contents on-chain.
          </p>
          <p>
            The proof and public signals can be submitted to Starknet, where a
            Cairo smart contract verifies them using Garaga&apos;s BN254 pairing
            engine.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-[1px] bg-white/10 mt-2">
            {[
              ["CIRCUIT", "circom (jwt_verify)"],
              ["PROVER", "rapidsnark / snarkjs"],
              ["VERIFIER", "Garaga Groth16 (Cairo)"],
            ].map(([k, v]) => (
              <div key={k} className="bg-black p-5">
                <div className="text-[10px] tracking-[0.25em] text-white/35 mb-1">
                  {k}
                </div>
                <div className="text-white/90 font-mono text-sm">{v}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="api" title="API_ENDPOINT">
          <div className="border border-white/20 p-5 font-mono text-sm flex items-center justify-between gap-4">
            <div>
              <span className="text-white/50">POST{" "}</span>
              <span className="text-white">
                https://api.cerebro.cavos.xyz/prove
              </span>
            </div>
            <CopyButton text="https://api.cerebro.cavos.xyz/prove" />
          </div>
          <p>
            The prover accepts JSON payloads up to 1MB. All communication is
            over HTTPS with CORS enabled.
          </p>
        </Section>

        <Section id="request" title="REQUEST_FORMAT">
          <p>Send a POST request with the following JSON body:</p>
          <CodeBlock
            lang="json"
            code={`{
  "jwt": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi...",
  "modulus": "2148399...large decimal or hex string..."
}`}
          />

          <div className="space-y-4 mt-2">
            <div className="border border-white/15 p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-white text-sm">jwt</span>
                <span className="text-[10px] tracking-[0.2em] text-white/40 border border-white/20 px-2 py-0.5">
                  REQUIRED
                </span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                A complete RS256-signed JWT string with three dot-separated parts
                (header.payload.signature). Must contain{" "}
                <code className="text-white/90 bg-white/5 px-1.5 py-0.5">sub</code>,{" "}
                <code className="text-white/90 bg-white/5 px-1.5 py-0.5">iss</code>,{" "}
                <code className="text-white/90 bg-white/5 px-1.5 py-0.5">aud</code>,{" "}
                <code className="text-white/90 bg-white/5 px-1.5 py-0.5">nonce</code>, and{" "}
                <code className="text-white/90 bg-white/5 px-1.5 py-0.5">exp</code> claims.
                Must not be expired.
              </p>
            </div>
            <div className="border border-white/15 p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-white text-sm">modulus</span>
                <span className="text-[10px] tracking-[0.2em] text-white/40 border border-white/20 px-2 py-0.5">
                  REQUIRED
                </span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                The RSA public key modulus (n) from the JWKS endpoint of the JWT
                issuer. Accepts decimal string or hex format.
              </p>
            </div>
          </div>
        </Section>

        <Section id="response" title="RESPONSE_FORMAT">
          <p>On success, the API returns:</p>
          <CodeBlock
            lang="json"
            code={`{
  "success": true,
  "proof": {
    "pi_a": ["12345...", "67890...", "1"],
    "pi_b": [["12345...", "67890..."], ["12345...", "67890..."], ["1", "0"]],
    "pi_c": ["12345...", "67890...", "1"],
    "protocol": "groth16",
    "curve": "bn128"
  },
  "publicSignals": [
    "pubkey_hash",
    "sub_hash",
    "nonce_hash",
    "iss_hash",
    "aud_hash",
    "exp"
  ],
  "claims": {
    "pubkey_hash": "1234567890...",
    "sub_hash": "9876543210...",
    "nonce_hash": "1111111111...",
    "iss_hash": "2222222222...",
    "aud_hash": "3333333333...",
    "exp": "1716000000"
  },
  "prover": "rapidsnark",
  "provingTimeSeconds": 4.2
}`}
          />

          <h3 className="text-white font-bold tracking-[0.15em] text-sm mt-8 mb-4">
            PUBLIC_SIGNALS
          </h3>
          <div className="space-y-3">
            {[
              ["[0] pubkey_hash", "Poseidon hash of the RSA modulus chunks"],
              ["[1] sub_hash", "Hash of the JWT 'sub' claim (user ID)"],
              ["[2] nonce_hash", "Hash of the 'nonce' claim (session binding)"],
              ["[3] iss_hash", "Hash of the 'iss' claim (token issuer)"],
              ["[4] aud_hash", "Hash of the 'aud' claim (client ID)"],
              ["[5] exp", "JWT expiration timestamp (plaintext)"],
            ].map(([signal, desc]) => (
              <div
                key={signal}
                className="flex items-start gap-4 text-sm border-l-2 border-white/15 pl-4 py-1"
              >
                <code className="text-white/80 font-mono shrink-0 w-40">
                  {signal}
                </code>
                <span className="text-white/50">{desc}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="errors" title="ERROR_RESPONSES">
          <div className="space-y-3">
            {[
              ["400", "Missing 'jwt'", "JWT field not provided in request body"],
              ["400", "Missing 'modulus'", "Modulus field not provided"],
              [
                "400",
                "Invalid JWT structure",
                "JWT does not have 3 dot-separated parts",
              ],
              ["400", "JWT expired", "Token exp claim is in the past"],
              [
                "400",
                "Missing required claim: X",
                "JWT payload missing sub/iss/aud/nonce/exp",
              ],
              [
                "400",
                "JWT too large",
                "Signed message exceeds circuit max length (960 bytes)",
              ],
              [
                "500",
                "Internal prover error",
                "Witness generation or proof computation failed",
              ],
            ].map(([code, error, desc]) => (
              <div
                key={error}
                className="grid grid-cols-[3.5rem_1fr_1fr] gap-4 text-sm border border-white/10 p-4 font-mono"
              >
                <span className="text-white/40">{code}</span>
                <span className="text-white/80">{error}</span>
                <span className="text-white/45">{desc}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="circuit" title="CIRCUIT_DETAILS">
          <p>
            The{" "}
            <code className="text-white/90 bg-white/5 px-1.5 py-0.5">
              jwt_verify.circom
            </code>{" "}
            circuit performs the following operations inside the ZK proof:
          </p>
          <ul className="space-y-3 text-sm text-white/60 list-none mt-2">
            {[
              "RSA signature verification (2048-bit, 17 x 121-bit limbs)",
              "SHA-256 hash check of the signed JWT message",
              "Base64url decoding of the JWT payload",
              "Extraction and hashing of sub, iss, aud, nonce claims",
              "Plaintext output of exp for on-chain expiration checks",
            ].map((item) => (
              <li key={item} className="flex gap-3 items-start">
                <span className="text-white/30 mt-0.5">{">"}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-[1px] bg-white/10 mt-6">
            {[
              ["MAX_MSG_LEN", "1024 bytes"],
              ["MAX_PAYLOAD", "768 bytes"],
              ["RSA_LIMBS", "17 x 121 bits"],
              ["CONSTRAINTS", "~2.5M"],
            ].map(([k, v]) => (
              <div key={k} className="bg-black p-5">
                <div className="text-[10px] tracking-[0.25em] text-white/35 mb-1">
                  {k}
                </div>
                <div className="text-white/90 font-mono text-sm">{v}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="contracts" title="SMART_CONTRACTS">
          <p>
            On-chain verification uses a Garaga-generated Groth16 verifier
            contract deployed on Starknet. The contract exposes a single
            function:
          </p>
          <CodeBlock
            lang="cairo"
            code={`fn verify_groth16_proof_bn254(
    full_proof_with_hints: Span<felt252>
) -> Result<Span<u256>, felt252>`}
          />

          <h3 className="text-white font-bold tracking-[0.15em] text-sm mt-8 mb-4">
            DEPLOYED_ADDRESSES
          </h3>
          <div className="space-y-3">
            <div className="border border-white/15 p-5">
              <div className="text-[10px] tracking-[0.25em] text-white/35 mb-2">
                STARKNET_SEPOLIA
              </div>
              <code className="font-mono text-sm text-white/60">
                Deployment pending
              </code>
            </div>
            <div className="border border-white/15 p-5">
              <div className="text-[10px] tracking-[0.25em] text-white/35 mb-2">
                STARKNET_MAINNET
              </div>
              <code className="font-mono text-sm text-white/60">
                Deployment pending
              </code>
            </div>
          </div>
        </Section>

        <Section id="integration" title="INTEGRATION_GUIDE">
          <h3 className="text-white font-bold tracking-[0.15em] text-sm">
            1. FETCH_JWKS
          </h3>
          <p>
            Retrieve the RSA public key from the OIDC provider&apos;s JWKS
            endpoint and extract the modulus.
          </p>
          <CodeBlock
            lang="typescript"
            code={`// Fetch Google's JWKS and extract the modulus
const jwks = await fetch(
  "https://www.googleapis.com/oauth2/v3/certs"
).then(r => r.json());

const key = jwks.keys.find(k => k.kid === jwtHeader.kid);
const modulus = BigInt(
  "0x" + Buffer.from(key.n, "base64url").toString("hex")
).toString();`}
          />

          <h3 className="text-white font-bold tracking-[0.15em] text-sm mt-10">
            2. GENERATE_PROOF
          </h3>
          <CodeBlock
            lang="typescript"
            code={`const response = await fetch("https://api.cerebro.cavos.xyz/prove", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ jwt: idToken, modulus }),
});

const { proof, publicSignals, claims } = await response.json();`}
          />

          <h3 className="text-white font-bold tracking-[0.15em] text-sm mt-10">
            3. VERIFY_ON_CHAIN
          </h3>
          <p>
            Serialize the proof using Garaga&apos;s calldata format and call the
            verifier contract:
          </p>
          <CodeBlock
            lang="typescript"
            code={`// Garaga serialization order:
// [pi_a.x, pi_a.y, pi_b[0][1], pi_b[0][0],
//  pi_b[1][1], pi_b[1][0], pi_c.x, pi_c.y]
// Then append public signals

const tx = await account.execute({
  contractAddress: VERIFIER_ADDRESS,
  entrypoint: "verify_groth16_proof_bn254",
  calldata: fullProofWithHints,
});`}
          />

          <h3 className="text-white font-bold tracking-[0.15em] text-sm mt-10">
            4. CURL_EXAMPLE
          </h3>
          <CodeBlock
            lang="bash"
            code={`curl -X POST https://api.cerebro.cavos.xyz/prove \\
  -H "Content-Type: application/json" \\
  -d '{
    "jwt": "eyJhbGciOiJSUzI1NiIs...",
    "modulus": "21387645123490812039..."
  }'`}
          />
        </Section>

        <div className="border-t border-white/10 pt-8 pb-4 text-[11px] text-white/25 font-mono tracking-[0.15em]">
          CEREBRO_DOCUMENTATION // v1.0
        </div>
      </div>
    </div>
  );
}
