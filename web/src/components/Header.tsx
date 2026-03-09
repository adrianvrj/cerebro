"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV = [
  { label: "TRY_IT", href: "/prove" },
  { label: "DOCS", href: "/docs" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-sm z-50">
      <Link
        href="/"
        className="flex items-center gap-2 text-xl font-bold cursor-pointer"
      >
        <span className="glitch-hover" data-text="[CEREBRO]">[CEREBRO]</span>
        <Image
          src="/cerebro-icon.png"
          alt="Cerebro Logo"
          width={24}
          height={24}
        />
      </Link>

      <nav className="flex items-center gap-6">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            data-text={item.label}
            className={`text-[11px] tracking-[0.25em] font-mono transition-colors duration-100 border px-3 py-1.5 glitch-hover ${
              pathname === item.href
                ? "bg-white text-black border-white"
                : "border-white/20 text-white/50 hover:text-white hover:border-white"
            }`}
          >
            {item.label}
          </Link>
        ))}

        <div className="flex items-center gap-2 text-[10px] tracking-[0.15em] text-white/30 font-mono ml-2">
          <div className="w-1.5 h-1.5 bg-white pulse-indicator" />
          <span className="hidden sm:inline">ONLINE</span>
        </div>
      </nav>
    </header>
  );
}
