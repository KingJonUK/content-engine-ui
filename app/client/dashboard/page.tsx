"use client";

import { useEffect, useState } from "react";
import { getClients, getContent, getCampaigns, type Client, type ContentBrief, type Campaign, CONTENT_STATUSES } from "@/lib/api";
import { Badge, Select } from "@/components/ui";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileText, Megaphone, TrendingUp, Users } from "lucide-react";

export default function ClientDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [content, setContent] = useState<ContentBrief[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClients().then((cs) => { setClients(cs); if (cs.length) setSelectedId(cs[0].id); });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    Promise.all([getContent(selectedId), getCampaigns(selectedId)])
      .then(([c, camps]) => { setContent(c); setCampaigns(camps); })
      .finally(() => setLoading(false));
  }, [selectedId]);

  const statusCounts = CONTENT_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = content.filter((c) => c.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const published = statusCounts.published ?? 0;
  const inProgress = (statusCounts.draft ?? 0) + (statusCounts.brief ?? 0) + (statusCounts.review ?? 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: "var(--text-primary)" }}>
            {clients.find((c) => c.id === selectedId)?.name ?? "Client"} Portal
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Your content overview</p>
        </div>
        {clients.length > 1 && (
          <Select
            value={String(selectedId ?? "")}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            options={clients.map((c) => ({ value: String(c.id), label: c.name }))}
            style={{ width: 200 }}
          />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Published", value: published, icon: TrendingUp, color: "var(--accent)" },
          { label: "In Progress", value: inProgress, icon: FileText, color: "var(--jade)" },
          { label: "Active Campaigns", value: activeCampaigns, icon: Megaphone, color: "var(--ember)" },
          { label: "Total Content", value: content.length, icon: Users, color: "var(--gold)" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl p-5"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
          >
            <Icon size={18} style={{ color, marginBottom: 12 }} />
            <p className="text-3xl font-bold font-display" style={{ color: "var(--text-primary)" }}>
              {loading ? "—" : value}
            </p>
            <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-secondary)" }}>
          Content Pipeline
        </h2>
        <div className="flex items-end gap-2 h-24">
          {CONTENT_STATUSES.map((s) => {
            const count = statusCounts[s] ?? 0;
            const max = Math.max(...Object.values(statusCounts), 1);
            const pct = (count / max) * 100;
            return (
              <div key={s} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>{count}</span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${Math.max(pct, 4)}%`,
                    background: `rgba(110,86,207,${0.2 + (CONTENT_STATUSES.indexOf(s) / CONTENT_STATUSES.length) * 0.6})`,
                  }}
                />
                <Badge status={s} label={s.slice(0, 4)} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent content */}
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Recent Content
          </h2>
          <Link href="/client/content" className="text-xs hover:underline" style={{ color: "var(--accent-light)" }}>
            View all →
          </Link>
        </div>
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-14 rounded-lg" />)
            : content.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: "var(--surface-overlay)" }}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {item.platform} · {item.contentType}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge status={item.status} />
                    <span className="text-xs hidden sm:block" style={{ color: "var(--text-muted)" }}>
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
