"use client";

import { useEffect, useState } from "react";
import { getClients, getContent, type Client, type ContentBrief, CONTENT_STATUSES, PLATFORMS } from "@/lib/api";
import { Badge, Select, EmptyState } from "@/components/ui";
import { FileText, Filter } from "lucide-react";

export default function ClientContentPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [content, setContent] = useState<ContentBrief[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    getClients().then((cs) => { setClients(cs); if (cs.length) setSelectedId(cs[0].id); });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    getContent(selectedId, statusFilter ? { status: statusFilter } : undefined)
      .then(setContent)
      .finally(() => setLoading(false));
  }, [selectedId, statusFilter]);

  const filtered = platformFilter ? content.filter((c) => c.platform === platformFilter) : content;

  return (
    <div className="animate-fade-up">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: "var(--text-primary)" }}>My Content</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{filtered.length} pieces</p>
        </div>
        {clients.length > 1 && (
          <Select
            value={String(selectedId ?? "")}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            options={clients.map((c) => ({ value: String(c.id), label: c.name }))}
            style={{ width: 180 }}
          />
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Filter size={13} style={{ color: "var(--text-muted)" }} />
        {["", ...CONTENT_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: statusFilter === s ? "var(--accent)" : "var(--surface-raised)",
              color: statusFilter === s ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            {s === "" ? "All" : s}
          </button>
        ))}
        <div className="ml-2 w-px h-4" style={{ background: "var(--border)" }} />
        <Select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          options={PLATFORMS.map((p) => ({ value: p, label: p }))}
          placeholder="All platforms"
          style={{ width: 150 }}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-20 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No content yet" description="Your content will appear here once it's been created" />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-xl overflow-hidden transition-all"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
            >
              <button
                className="w-full flex items-center justify-between p-4 text-left"
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {item.platform} · {item.contentType} · {item.funnelStage}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge status={item.status} />
                  {item.qualityScore && (
                    <span className="text-xs font-mono hidden sm:block" style={{ color: "var(--jade)" }}>
                      {item.qualityScore}/100
                    </span>
                  )}
                </div>
              </button>

              {expanded === item.id && (
                <div
                  className="px-4 pb-4 space-y-4 animate-fade-in"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  {item.hook && (
                    <div className="pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Hook</p>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.hook}</p>
                    </div>
                  )}
                  {item.body && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Body</p>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{item.body}</p>
                    </div>
                  )}
                  {item.cta && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>CTA</p>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.cta}</p>
                    </div>
                  )}
                  {item.notes && (
                    <div className="p-3 rounded-lg text-xs" style={{ background: "var(--surface-overlay)", color: "var(--text-muted)" }}>
                      📝 {item.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
