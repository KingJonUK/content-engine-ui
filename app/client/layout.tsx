"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Megaphone, Zap, ArrowLeft } from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/content", label: "My Content", icon: FileText },
  { href: "/client/campaigns", label: "Campaigns", icon: Megaphone },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen" style={{ background: "var(--ink)" }}>
      {/* Top nav */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-3"
        style={{
          background: "rgba(10,10,15,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent)" }}
            >
              <Zap size={14} color="#fff" />
            </div>
            <span className="font-display font-bold text-sm tracking-widest uppercase" style={{ color: "var(--text-primary)", letterSpacing: "0.12em" }}>
              Content Engine
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all",
                    active ? "text-white" : "hover:text-primary"
                  )}
                  style={{
                    background: active ? "rgba(110,86,207,0.18)" : "transparent",
                    color: active ? "var(--accent-light)" : "var(--text-secondary)",
                  }}
                >
                  <Icon size={14} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-1.5 text-xs transition-colors hover:text-primary"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={11} />
          Admin
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 bg-grid min-h-screen">
        {children}
      </main>
    </div>
  );
}
