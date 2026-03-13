"use client";

import { useEffect, useState } from "react";
import { getClients, getCampaigns, getContent, type Client, type Campaign, type ContentBrief } from "@/lib/api";
import { Badge, Select, EmptyState } from "@/components/ui";
import { Megaphone, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function ClientCampaignsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contentMap, setContentMap] = useState<Record<number, ContentBrief[]>>({});
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    getClients().then((cs) => { setClients(cs); if (cs.length) setSelectedId(cs[0].id); });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    Promise.all([getCampaigns(selectedId), getContent(selectedId)])
      .then(([camps, allContent]) => {
        setCampaigns(camps);
        const map: Record<number, ContentBrief[]> = {};
        camps.forEach((c) => { map[c.id] = allContent.filter((item) => item.campaignId === c.id); });
        setContentMap(map);
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  return (
    <div className="animate-fade-up">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: "var(--text-primary)" }}>Campaigns</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</p>
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

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer h-32 rounded-xl" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState icon={Megaphone} title="No campaigns" description="Your campaigns will appear here" />
      ) : (
        <div className="space-y-4">
          {campaigns.map((camp) => {
            const items = contentMap[camp.id] ?? [];
            const isOpen = expanded === camp.id;
            return (
              <div
                key={camp.id}
                className="rounded-xl overflow-hidden"
                style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
              >
                <button
                  className="w-full p-5 text-left"
                  onClick={() => setExpanded(isOpen ? null : camp.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{camp.name}</h3>
                        <Badge status={camp.status} />
                      </div>
                      {camp.description && (
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{camp.description}</p>
                      )}
                      {(camp.startDate || camp.endDate) && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                          <Calendar size={11} />
                          {camp.startDate ? format(new Date(camp.startDate), "d MMM yyyy") : "—"}
                          {" → "}
                          {camp.endDate ? format(new Date(camp.endDate), "d MMM yyyy") : "ongoing"}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <span className="text-xs font-mono px-2 py-1 rounded-lg" style={{ background: "var(--surface-overlay)", color: "var(--text-muted)" }}>
                        {items.length} piece{items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </button>

                {isOpen && items.length > 0 && (
                  <div className="px-5 pb-5 animate-fade-in" style={{ borderTop: "1px solid var(--border)" }}>
                    <div className="space-y-2 pt-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-lg"
                          style={{ background: "var(--surface-overlay)" }}
                        >
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.platform} · {item.contentType}</p>
                          </div>
                          <Badge status={item.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
