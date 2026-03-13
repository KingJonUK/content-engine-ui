"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  FileText,
  Bot,
  Settings,
  ChevronLeft,
  Zap,
  MessageSquare,
  GitBranch,
} from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/admin/dashboard",  label: "Dashboard",     icon: LayoutDashboard },
  { href: "/admin/clients",    label: "Clients",        icon: Users },
  { href: "/admin/campaigns",  label: "Campaigns",      icon: Megaphone },
  { href: "/admin/content",    label: "Content",        icon: FileText },
  { href: "/admin/pipeline",   label: "Pipeline",       icon: GitBranch },
  { href: "/admin/agents",     label: "Agent Runner",   icon: Bot },
  { href: "/admin/chat",       label: "AI Chat",        icon: MessageSquare },
  { href: "/admin/settings",   label: "Settings",       icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--ink)" }}>
      {/* Sidebar */}
      <aside
        className={clsx(
          "flex flex-col flex-shrink-0 transition-all duration-300 relative",
          collapsed ? "w-16" : "w-60"
        )}
        style={{
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-5 overflow-hidden"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)", boxShadow: "0 0 16px rgba(110,86,207,0.5)" }}
          >
            <Zap size={16} color="#fff" />
          </div>
          {!collapsed && (
            <span
              className="font-display font-700 text-sm tracking-widest uppercase whitespace-nowrap"
              style={{ color: "var(--text-primary)", letterSpacing: "0.15em" }}
            >
              Content Engine
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-hidden">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative overflow-hidden",
                  active
                    ? "text-white"
                    : "text-secondary hover:text-primary"
                )}
                style={
                  active
                    ? {
                        background: "rgba(110,86,207,0.18)",
                        borderLeft: "2px solid var(--accent)",
                      }
                    : { borderLeft: "2px solid transparent" }
                }
              >
                <Icon
                  size={17}
                  className="flex-shrink-0"
                  style={{ color: active ? "var(--accent-light)" : "inherit" }}
                />
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">{label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Client portal link */}
        {!collapsed && (
          <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <Link
              href="/client/dashboard"
              className="flex items-center gap-2 text-xs rounded-md px-3 py-2 transition-colors"
              style={{ color: "var(--text-muted)", background: "var(--surface-raised)" }}
            >
              <Users size={13} />
              <span>Switch to Client View</span>
            </Link>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:opacity-90"
          style={{
            background: "var(--surface-overlay)",
            border: "1px solid var(--border-bright)",
            color: "var(--text-secondary)",
          }}
        >
          <ChevronLeft
            size={12}
            style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          />
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-grid">
        {children}
      </main>
    </div>
  );
}
