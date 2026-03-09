"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Lock,
  ArrowRight,
  Fingerprint,
  Globe,
  KeyRound,
  Layers,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1 },
  }),
};

const STEPS = [
  {
    num: "01",
    title: "SUBMIT",
    desc: "Send a JWT and its RSA modulus to the Cerebro prover API.",
  },
  {
    num: "02",
    title: "PROVE",
    desc: "The circuit extracts claims and generates a Groth16 proof via rapidsnark.",
  },
  {
    num: "03",
    title: "VERIFY",
    desc: "Submit the proof on-chain. The Cairo verifier confirms validity in a single transaction.",
  },
];

const USE_CASES = [
  {
    icon: Fingerprint,
    title: "ACCOUNT_ABSTRACTION",
    desc: "Create and control Starknet smart accounts using social logins and standard OIDC JWTs. No seed phrases required.",
  },
  {
    icon: Globe,
    title: "GASLESS_ONBOARDING",
    desc: "Onboard users to Web3 with familiar Web2 authentication flows. No crypto holdings needed to start.",
  },
  {
    icon: Lock,
    title: "PRIVACY_PRESERVING",
    desc: "Verify off-chain credentials on-chain without exposing payload data in transaction calldata.",
  },
  {
    icon: KeyRound,
    title: "SESSION_KEYS",
    desc: "Authorize session constraints on-chain using JWT-backed ZK proofs for time-limited delegated access.",
  },
];

const STATS = [
  { value: "~5s", label: "PROVING_TIME" },
  { value: "6", label: "PUBLIC_SIGNALS" },
  { value: "BN254", label: "CURVE" },
  { value: "GROTH16", label: "PROOF_SYSTEM" },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="px-6 py-24 md:py-32 max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div variants={fadeUp} custom={0} className="space-y-4">
            <div className="text-[10px] tracking-[0.5em] text-white/30 font-mono">
              ZERO_KNOWLEDGE // JWT_VERIFICATION // STARKNET
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95]">
              PROVE IDENTITY.
              <br />
              <span className="text-white/30 reveal-text">REVEAL NOTHING.</span>
            </h1>
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={1}
            className="text-white/50 text-lg md:text-xl max-w-2xl leading-relaxed"
          >
            Cerebro generates Groth16 zero-knowledge proofs for JWT
            verification. Authenticate users on Starknet without exposing
            sensitive token data on-chain.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={2}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link
              href="/prove"
              className="border border-white px-6 py-3 text-sm tracking-[0.3em] font-bold uppercase hover:bg-white hover:text-black transition-colors duration-100 flex items-center justify-center gap-3"
            >
              <span className="glitch-hover" data-text="TRY_IT_NOW">TRY_IT_NOW</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/docs"
              className="border border-white/20 px-6 py-3 text-sm tracking-[0.3em] text-white/50 uppercase hover:text-white hover:border-white transition-colors duration-100 text-center"
            >
              <span className="glitch-hover" data-text="READ_DOCS">READ_DOCS</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/10">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="px-6 py-5 border-r border-white/5 last:border-r-0 text-center"
            >
              <div className="text-2xl md:text-3xl font-bold font-mono">
                {stat.value}
              </div>
              <div className="text-[9px] tracking-[0.3em] text-white/30 mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 md:py-28 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="text-[10px] tracking-[0.5em] text-white/30 font-mono mb-3">
            PROTOCOL
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            HOW IT WORKS
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/10">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
              className="bg-black p-6 space-y-4"
            >
              <div className="text-5xl font-bold font-mono text-white/10">
                {step.num}
              </div>
              <div className="text-lg font-bold tracking-[0.2em]">
                {step.title}
              </div>
              <div className="text-sm text-white/40 leading-relaxed">
                {step.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Architecture diagram (text-based) */}
      <section className="border-y border-white/10 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-mono text-[11px] md:text-xs text-white/30 leading-loose text-center space-y-2"
          >
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="border border-white/20 px-3 py-1 text-white/60">
                CLIENT
              </span>
              <span>{"———>"}</span>
              <span className="border border-white/20 px-3 py-1 text-white/60">
                JWT + MODULUS
              </span>
              <span>{"———>"}</span>
              <span className="border border-white px-3 py-1 text-white bg-white/5">
                CEREBRO_PROVER
              </span>
              <span>{"———>"}</span>
              <span className="border border-white/20 px-3 py-1 text-white/60">
                GROTH16_PROOF
              </span>
              <span>{"———>"}</span>
              <span className="border border-white/20 px-3 py-1 text-white/60">
                STARKNET
              </span>
            </div>
            <div className="text-white/15">
              circom witness {"→"} rapidsnark prover {"→"} garaga verifier
            </div>
          </motion.div>
        </div>
      </section>

      {/* Use cases */}
      <section className="px-6 py-20 md:py-28 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="text-[10px] tracking-[0.5em] text-white/30 font-mono mb-3">
            APPLICATIONS
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            USE CASES
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/10">
          {USE_CASES.map((uc, i) => (
            <motion.div
              key={uc.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-black p-6 space-y-3 group hover:bg-white hover:text-black transition-colors duration-150"
            >
              <uc.icon
                size={20}
                className="text-white/40 group-hover:text-black/40"
              />
              <div className="text-sm font-bold tracking-[0.2em]">
                {uc.title}
              </div>
              <div className="text-sm text-white/40 group-hover:text-black/60 leading-relaxed">
                {uc.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section className="border-t border-white/10 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          >
            {[
              { icon: Shield, label: "CIRCOM_CIRCUITS" },
              { icon: Zap, label: "RAPIDSNARK" },
              { icon: Layers, label: "GARAGA" },
              { icon: Lock, label: "STARKNET" },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <item.icon size={20} className="mx-auto text-white/30" />
                <div className="text-[10px] tracking-[0.3em] text-white/40 font-mono">
                  {item.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 md:py-28 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            START PROVING
          </h2>
          <p className="text-white/40 max-w-lg mx-auto">
            Generate your first zero-knowledge proof in seconds. No setup
            required.
          </p>
          <Link
            href="/prove"
            className="inline-flex items-center gap-3 border border-white px-8 py-3 text-sm tracking-[0.3em] font-bold uppercase hover:bg-white hover:text-black transition-colors duration-100"
          >
            <span className="glitch-hover" data-text="LAUNCH_PROVER">LAUNCH_PROVER</span>
            <ArrowRight size={14} />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
