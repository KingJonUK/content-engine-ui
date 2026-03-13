"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats, type DashboardStats } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Users, Megaphone, FileText, Bot, TrendingUp, Clock, ArrowRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  idea: "var(--text-muted)",
  brief: "var(--text-secondary)",
  draft: "var(--gold)",
  review: "#f59e0b",
  approved: "var(--jade)",
  published: "var(--accent)",
  running: "var(--gold)",
  completed: "var(--jade)",
  failed: "#ef4444",
};

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  accent: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 group"
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}22`, border: `1px solid ${accent}44` }}
        >
          <Icon size={18} style={{ color: accent }} />
        </div>
        <ArrowRight
          size={14}
          style={{ color: "var(--text-muted)" }}
          className="opacity-0 group-hover:opacity-100 transition-opacity mt-1"
        />
      </div>
      <div className="mt-4">
        <p className="text-3xl font-display font-bold" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
        <p className="text-xs mt-1 font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
      </div>
    </Link>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`shimmer rounded-lg ${className ?? ""}`} />;
}


const OUTPUT_TYPE_LABEL = Object.fromEntries(OUTPUT_TYPES.map((t) => [t.key, `${t.emoji} ${t.label}`]));

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="p-8">
        <div
          className="rounded-xl p-6 text-center"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
        >
          <p style={{ color: "#ef4444" }}>Failed to load dashboard: {error}</p>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            Make sure the API is running and NEXT_PUBLIC_API_URL is set correctly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-display font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Overview
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Your content engine at a glance
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))
        ) : (
          <>
            <StatCard label="Total Clients" value={stats!.totalClients} icon={Users} accent="var(--accent)" href="/admin/clients" />
            <StatCard label="Active Campaigns" value={stats!.activeCampaigns} icon={Megaphone} accent="var(--ember)" href="/admin/campaigns" />
            <StatCard label="In Pipeline" value={stats!.contentInPipeline} icon={FileText} accent="var(--jade)" href="/admin/content" />
            <StatCard label="Published" value={stats!.contentPublished} icon={TrendingUp} accent="var(--gold)" href="/admin/content" />
            <StatCard label="Agent Runs Today" value={stats!.agentRunsToday} icon={Bot} accent="var(--accent-light)" href="/admin/agents" />
          </>
        )}
      </div>

      {/* Bottom two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Content */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Recent Content
            </h2>
            <Link
              href="/admin/content"
              className="text-xs hover:underline"
              style={{ color: "var(--accent-light)" }}
            >
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)
              : stats!.recentContent.length === 0
              ? (
                <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
                  No content yet
                </p>
              )
              : stats!.recentContent.map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/content/${c.id}`}
                    className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-surface-overlay group"
                    style={{ background: "var(--surface-overlay)" }}
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {c.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {OUTPUT_TYPE_LABEL[c.contentType] ?? c.platform}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-mono"
                        style={{
                          background: `${STATUS_COLORS[c.status] ?? "var(--text-muted)"}22`,
                          color: STATUS_COLORS[c.status] ?? "var(--text-muted)",
                        }}
                      >
                        {c.status}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </Link>
                ))}
          </div>
        </div>

        {/* Recent Agent Runs */}
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Recent Agent Runs
            </h2>
            <Link
              href="/admin/agents"
              className="text-xs hover:underline"
              style={{ color: "var(--accent-light)" }}
            >
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)
              : stats!.recentRuns.length === 0
              ? (
                <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
                  No runs yet
                </p>
              )
              : stats!.recentRuns.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: "var(--surface-overlay)" }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span
                        className="status-dot flex-shrink-0"
                        style={{ background: STATUS_COLORS[r.status] }}
                      />
                      <div className="min-w-0">
                        <p
                          className="text-sm font-mono truncate"
                          style={{ color: "var(--text-secondary)", fontSize: 12 }}
                        >
                          {r.agentType.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                          {r.model ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <Clock size={11} style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
